import type { Question, QuestionOption, Survey } from '@prisma/client';
import type { AnswerInput, SubmitResponseInput } from '@forms-assistant/shared';
import type {
  SurveyForTakingDto,
  SurveyParticipantDto,
  SurveyResultQuestionDto,
  SurveyResultsDto,
} from '@forms-assistant/shared';
import { prisma } from '../../lib/prisma';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../lib/errors';
import { hashAnonymousToken } from '../../lib/anonymous-token';
import { toUserDto } from '../users/user.mapper';
import { notify } from '../notifications/notifications.service';

type QuestionWithOptions = Question & { options: QuestionOption[] };

const QUESTIONS_INCLUDE = { questions: { include: { options: true } } } as const;

async function loadQuestions(surveyId: string): Promise<QuestionWithOptions[]> {
  const survey = await prisma.survey.findUniqueOrThrow({
    where: { id: surveyId },
    include: QUESTIONS_INCLUDE,
  });
  return survey.questions.slice().sort((a, b) => a.order - b.order);
}

interface TakingContext {
  userId?: string;
  anonymousToken?: string;
}

export async function buildSurveyForTaking(
  survey: Survey,
  context: TakingContext,
): Promise<SurveyForTakingDto> {
  const questions = await loadQuestions(survey.id);
  const requiresAuth = survey.anonymityMode !== 'ANONYMOUS';

  let alreadySubmitted = false;
  if (!survey.allowMultipleSubmissions) {
    if (survey.anonymityMode === 'ANONYMOUS') {
      if (context.anonymousToken) {
        const guard = await prisma.anonymousSubmissionGuard.findUnique({
          where: {
            surveyId_tokenHash: {
              surveyId: survey.id,
              tokenHash: hashAnonymousToken(survey.id, context.anonymousToken),
            },
          },
        });
        alreadySubmitted = Boolean(guard);
      }
    } else if (context.userId) {
      const participation = await prisma.participation.findUnique({
        where: { surveyId_userId: { surveyId: survey.id, userId: context.userId } },
      });
      alreadySubmitted = Boolean(participation);
    }
  }

  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    anonymityMode: survey.anonymityMode,
    allowMultipleSubmissions: survey.allowMultipleSubmissions,
    requiresAuth,
    alreadySubmitted,
    questions: questions.map((question) => ({
      id: question.id,
      type: question.type,
      text: question.text,
      required: question.required,
      order: question.order,
      options: question.options
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((option) => ({ id: option.id, text: option.text, order: option.order })),
    })),
  };
}

function validateAnswers(questions: QuestionWithOptions[], answers: AnswerInput[]) {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));

  for (const question of questions) {
    const answer = answerByQuestionId.get(question.id);
    if (!answer) {
      if (question.required) {
        throw new BadRequestError(`Вопрос "${question.text}" обязателен для ответа`);
      }
      continue;
    }

    if (question.type === 'TEXT') {
      if (!answer.textValue || answer.textValue.trim().length === 0) {
        if (question.required) {
          throw new BadRequestError(`Вопрос "${question.text}" обязателен для ответа`);
        }
      }
      continue;
    }

    const optionIds = new Set(question.options.map((option) => option.id));
    const selected = answer.selectedOptionIds ?? [];
    if (selected.length === 0) {
      if (question.required) {
        throw new BadRequestError(`Вопрос "${question.text}" обязателен для ответа`);
      }
      continue;
    }
    if (question.type === 'SINGLE_CHOICE' && selected.length > 1) {
      throw new BadRequestError(`Вопрос "${question.text}" допускает только один вариант ответа`);
    }
    for (const optionId of selected) {
      if (!optionIds.has(optionId)) {
        throw new BadRequestError(`Некорректный вариант ответа для вопроса "${question.text}"`);
      }
    }
  }

  for (const answer of answers) {
    if (!questionById.has(answer.questionId)) {
      throw new BadRequestError('Ответ ссылается на несуществующий вопрос');
    }
  }
}

interface SubmitContext {
  userId?: string;
  anonymousToken?: string;
}

export async function submitResponse(
  survey: Survey,
  input: SubmitResponseInput,
  context: SubmitContext,
) {
  const questions = await loadQuestions(survey.id);
  validateAnswers(questions, input.answers);

  const requiresAuth = survey.anonymityMode !== 'ANONYMOUS';
  if (requiresAuth && !context.userId) {
    throw new UnauthorizedError('Для прохождения этого опроса нужно войти в аккаунт');
  }

  if (!survey.allowMultipleSubmissions) {
    if (survey.anonymityMode === 'ANONYMOUS') {
      if (context.anonymousToken) {
        const guard = await prisma.anonymousSubmissionGuard.findUnique({
          where: {
            surveyId_tokenHash: {
              surveyId: survey.id,
              tokenHash: hashAnonymousToken(survey.id, context.anonymousToken),
            },
          },
        });
        if (guard) {
          throw new ConflictError('Вы уже проходили этот опрос');
        }
      }
    } else if (context.userId) {
      const participation = await prisma.participation.findUnique({
        where: { surveyId_userId: { surveyId: survey.id, userId: context.userId } },
      });
      if (participation) {
        throw new ConflictError('Вы уже проходили этот опрос');
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    const response = await tx.response.create({
      data: {
        surveyId: survey.id,
        respondentUserId: survey.anonymityMode === 'NAMED' ? (context.userId as string) : null,
      },
    });

    for (const answer of input.answers) {
      await tx.answer.create({
        data: {
          responseId: response.id,
          questionId: answer.questionId,
          textValue: answer.textValue ?? null,
          selectedOptions: answer.selectedOptionIds?.length
            ? { create: answer.selectedOptionIds.map((optionId) => ({ optionId })) }
            : undefined,
        },
      });
    }

    if (survey.anonymityMode === 'ANONYMOUS') {
      if (context.anonymousToken) {
        await tx.anonymousSubmissionGuard.create({
          data: {
            surveyId: survey.id,
            tokenHash: hashAnonymousToken(survey.id, context.anonymousToken),
          },
        });
      }
    } else {
      await tx.participation.upsert({
        where: { surveyId_userId: { surveyId: survey.id, userId: context.userId as string } },
        update: {},
        create: { surveyId: survey.id, userId: context.userId as string },
      });
    }
  });

  if (context.userId !== survey.authorId) {
    await notify(
      survey.authorId,
      'SURVEY_RESPONSE',
      `Новый ответ на опрос «${survey.title}»`,
      `/surveys/${survey.id}/results`,
    );
  }
}

export async function getResults(surveyId: string, authorId: string): Promise<SurveyResultsDto> {
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) {
    throw new BadRequestError('Опрос не найден');
  }
  if (survey.authorId !== authorId) {
    throw new ForbiddenError('Вы не являетесь автором этого опроса');
  }

  const questions = await loadQuestions(surveyId);
  const totalResponses = await prisma.response.count({ where: { surveyId } });

  const questionResults: SurveyResultQuestionDto[] = [];
  for (const question of questions) {
    const answers = await prisma.answer.findMany({
      where: { questionId: question.id },
      include: { selectedOptions: true },
    });

    if (question.type === 'TEXT') {
      questionResults.push({
        questionId: question.id,
        text: question.text,
        type: question.type,
        totalAnswers: answers.filter((answer) => answer.textValue?.trim()).length,
        textAnswers: answers
          .map((answer) => answer.textValue)
          .filter((value): value is string => Boolean(value)),
      });
      continue;
    }

    const counts = new Map(question.options.map((option) => [option.id, 0]));
    let totalAnswers = 0;
    for (const answer of answers) {
      if (answer.selectedOptions.length > 0) {
        totalAnswers += 1;
      }
      for (const selected of answer.selectedOptions) {
        counts.set(selected.optionId, (counts.get(selected.optionId) ?? 0) + 1);
      }
    }

    questionResults.push({
      questionId: question.id,
      text: question.text,
      type: question.type,
      totalAnswers,
      options: question.options
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((option) => {
          const count = counts.get(option.id) ?? 0;
          return {
            optionId: option.id,
            text: option.text,
            count,
            percentage: totalAnswers > 0 ? Math.round((count / totalAnswers) * 1000) / 10 : 0,
          };
        }),
    });
  }

  return {
    surveyId,
    totalResponses,
    isAnonymousAggregate: true,
    questions: questionResults,
  };
}

export async function getParticipants(
  surveyId: string,
  authorId: string,
): Promise<SurveyParticipantDto[]> {
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) {
    throw new BadRequestError('Опрос не найден');
  }
  if (survey.authorId !== authorId) {
    throw new ForbiddenError('Вы не являетесь автором этого опроса');
  }
  if (survey.anonymityMode === 'ANONYMOUS') {
    return [];
  }

  const participations = await prisma.participation.findMany({
    where: { surveyId },
    include: { user: true },
    orderBy: { completedAt: 'desc' },
  });

  return participations.map((participation) => ({
    user: toUserDto(participation.user),
    completedAt: participation.completedAt.toISOString(),
  }));
}

function csvEscape(value: string): string {
  if (/["\n,;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

export async function exportResultsCsv(
  surveyId: string,
  authorId: string,
): Promise<{ asciiFilename: string; utf8Filename: string; csv: string }> {
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) {
    throw new BadRequestError('Опрос не найден');
  }
  if (survey.authorId !== authorId) {
    throw new ForbiddenError('Вы не являетесь автором этого опроса');
  }

  const questions = await loadQuestions(surveyId);
  const includeRespondent = survey.anonymityMode === 'NAMED';

  const responses = await prisma.response.findMany({
    where: { surveyId },
    include: {
      respondent: true,
      answers: { include: { selectedOptions: { include: { option: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const headers = [
    ...(includeRespondent ? ['Респондент', 'Email'] : []),
    'Дата прохождения',
    ...questions.map((question) => question.text),
  ];

  const rows = responses.map((response) => {
    const answerByQuestionId = new Map(
      response.answers.map((answer) => [answer.questionId, answer]),
    );
    const cells = questions.map((question) => {
      const answer = answerByQuestionId.get(question.id);
      if (!answer) return '';
      if (question.type === 'TEXT') return answer.textValue ?? '';
      return answer.selectedOptions.map((selected) => selected.option.text).join('; ');
    });
    return [
      ...(includeRespondent
        ? [response.respondent?.displayName ?? '', response.respondent?.email ?? '']
        : []),
      response.createdAt.toISOString(),
      ...cells,
    ];
  });

  // Content-Disposition допускает только ASCII в filename= — для остального (например,
  // кириллицы) нужен RFC 5987 filename*=UTF-8''..., поэтому отдаём оба варианта.
  const asciiTitle = survey.title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return {
    asciiFilename: `survey-${asciiTitle || surveyId}.csv`,
    utf8Filename: `${survey.title}.csv`,
    csv: toCsv([headers, ...rows]),
  };
}
