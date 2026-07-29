import type { Question, QuestionOption, Survey } from '@prisma/client';
import type { QuestionDto, SurveyDetailDto, SurveySummaryDto } from '@forms-assistant/shared';

type QuestionWithOptions = Question & { options: QuestionOption[] };
type SurveyWithQuestions = Survey & {
  questions: QuestionWithOptions[];
  _count: { responses: number };
};

export function toSurveySummaryDto(
  survey: Survey & { _count: { responses: number } },
): SurveySummaryDto {
  return {
    id: survey.id,
    title: survey.title,
    description: survey.description,
    status: survey.status,
    anonymityMode: survey.anonymityMode,
    allowMultipleSubmissions: survey.allowMultipleSubmissions,
    createdAt: survey.createdAt.toISOString(),
    updatedAt: survey.updatedAt.toISOString(),
    authorId: survey.authorId,
    responseCount: survey._count.responses,
  };
}

export function toSurveyDetailDto(
  survey: SurveyWithQuestions,
  shareLinkToken: string | null,
): SurveyDetailDto {
  return {
    ...toSurveySummaryDto(survey),
    shareLinkToken,
    questions: survey.questions
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(toQuestionDto),
  };
}

function toQuestionDto(question: QuestionWithOptions): QuestionDto {
  return {
    id: question.id,
    type: question.type,
    text: question.text,
    required: question.required,
    order: question.order,
    options: question.options
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((option) => ({ id: option.id, text: option.text, order: option.order })),
  };
}
