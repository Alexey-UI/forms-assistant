import { randomBytes } from 'node:crypto';
import type { CreateSurveyInput, UpdateSurveyInput } from '@forms-assistant/shared';
import { prisma } from '../../lib/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../lib/errors';
import { toSurveyDetailDto, toSurveySummaryDto } from './surveys.mapper';

const QUESTIONS_INCLUDE = {
  questions: { include: { options: true } },
  _count: { select: { responses: true } },
} as const;

function toQuestionsCreateInput(questions: CreateSurveyInput['questions']) {
  return questions.map((question) => ({
    type: question.type,
    text: question.text,
    required: question.required,
    order: question.order,
    options: question.options?.length
      ? { create: question.options.map((option, index) => ({ text: option.text, order: index })) }
      : undefined,
  }));
}

async function getOwnedSurveyOrThrow(surveyId: string, authorId: string) {
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey) {
    throw new NotFoundError('Опрос не найден');
  }
  if (survey.authorId !== authorId) {
    throw new ForbiddenError('Вы не являетесь автором этого опроса');
  }
  return survey;
}

async function getShareLinkToken(surveyId: string): Promise<string | null> {
  const link = await prisma.surveyShareLink.findFirst({ where: { surveyId } });
  return link?.token ?? null;
}

export async function createSurvey(authorId: string, input: CreateSurveyInput) {
  const survey = await prisma.survey.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      authorId,
      anonymityMode: input.anonymityMode,
      allowMultipleSubmissions: input.allowMultipleSubmissions,
      questions: { create: toQuestionsCreateInput(input.questions) },
    },
    include: QUESTIONS_INCLUDE,
  });
  return toSurveyDetailDto(survey, null);
}

export async function listMySurveys(authorId: string) {
  const surveys = await prisma.survey.findMany({
    where: { authorId },
    include: { _count: { select: { responses: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return surveys.map(toSurveySummaryDto);
}

export async function listSharedWithMe(userId: string) {
  const surveys = await prisma.survey.findMany({
    where: {
      status: 'PUBLISHED',
      authorId: { not: userId },
      OR: [
        { invites: { some: { userId } } },
        { groupShares: { some: { group: { members: { some: { userId } } } } } },
      ],
    },
    include: { _count: { select: { responses: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return surveys.map(toSurveySummaryDto);
}

export async function getSurveyForAuthor(surveyId: string, authorId: string) {
  await getOwnedSurveyOrThrow(surveyId, authorId);
  const survey = await prisma.survey.findUniqueOrThrow({
    where: { id: surveyId },
    include: QUESTIONS_INCLUDE,
  });
  const shareLinkToken = await getShareLinkToken(surveyId);
  return toSurveyDetailDto(survey, shareLinkToken);
}

export async function updateSurvey(surveyId: string, authorId: string, input: UpdateSurveyInput) {
  const existing = await getOwnedSurveyOrThrow(surveyId, authorId);

  // Вопросы и режим анонимности можно менять только у черновика — после публикации
  // эти поля молча игнорируются, чтобы не ломать сохранение title/description и т.п.
  const isDraft = existing.status === 'DRAFT';
  const nextQuestions = isDraft ? input.questions : undefined;
  const nextAnonymityMode = isDraft ? input.anonymityMode : undefined;

  const survey = await prisma.$transaction(async (tx) => {
    if (nextQuestions) {
      await tx.question.deleteMany({ where: { surveyId } });
    }
    return tx.survey.update({
      where: { id: surveyId },
      data: {
        title: input.title,
        description: input.description,
        allowMultipleSubmissions: input.allowMultipleSubmissions,
        anonymityMode: nextAnonymityMode,
        questions: nextQuestions ? { create: toQuestionsCreateInput(nextQuestions) } : undefined,
      },
      include: QUESTIONS_INCLUDE,
    });
  });

  const shareLinkToken = await getShareLinkToken(surveyId);
  return toSurveyDetailDto(survey, shareLinkToken);
}

export async function deleteSurvey(surveyId: string, authorId: string) {
  await getOwnedSurveyOrThrow(surveyId, authorId);
  await prisma.survey.delete({ where: { id: surveyId } });
}

export async function publishSurvey(surveyId: string, authorId: string) {
  const survey = await getOwnedSurveyOrThrow(surveyId, authorId);
  if (survey.status !== 'DRAFT') {
    throw new BadRequestError('Опубликовать можно только черновик');
  }
  await prisma.survey.update({ where: { id: surveyId }, data: { status: 'PUBLISHED' } });
  return getSurveyForAuthor(surveyId, authorId);
}

export async function closeSurvey(surveyId: string, authorId: string) {
  const survey = await getOwnedSurveyOrThrow(surveyId, authorId);
  if (survey.status !== 'PUBLISHED') {
    throw new BadRequestError('Закрыть можно только опубликованный опрос');
  }
  await prisma.survey.update({ where: { id: surveyId }, data: { status: 'CLOSED' } });
  return getSurveyForAuthor(surveyId, authorId);
}

export async function createShareLink(surveyId: string, authorId: string) {
  await getOwnedSurveyOrThrow(surveyId, authorId);
  const existing = await prisma.surveyShareLink.findFirst({ where: { surveyId } });
  if (existing) {
    return existing.token;
  }
  const token = randomBytes(16).toString('hex');
  const created = await prisma.surveyShareLink.create({ data: { surveyId, token } });
  return created.token;
}

export async function revokeShareLink(surveyId: string, authorId: string) {
  await getOwnedSurveyOrThrow(surveyId, authorId);
  await prisma.surveyShareLink.deleteMany({ where: { surveyId } });
}

export async function inviteUsers(surveyId: string, authorId: string, userIds: string[]) {
  await getOwnedSurveyOrThrow(surveyId, authorId);
  await prisma.surveyInvite.createMany({
    data: userIds.map((userId) => ({ surveyId, userId })),
    skipDuplicates: true,
  });
}

export async function shareWithGroup(surveyId: string, authorId: string, groupId: string) {
  await getOwnedSurveyOrThrow(surveyId, authorId);
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: authorId } },
  });
  if (!membership) {
    throw new ForbiddenError('Вы не состоите в этой группе');
  }
  await prisma.surveyGroupShare.upsert({
    where: { surveyId_groupId: { surveyId, groupId } },
    update: {},
    create: { surveyId, groupId },
  });
}
