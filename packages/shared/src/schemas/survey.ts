import { z } from 'zod';
import { QuestionType, SurveyAnonymityMode } from '../enums';

export const questionOptionInputSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().trim().min(1, 'Вариант не может быть пустым').max(300),
  isCorrect: z.boolean().default(false),
});
export type QuestionOptionInput = z.infer<typeof questionOptionInputSchema>;

export const questionInputSchema = z
  .object({
    id: z.string().uuid().optional(),
    type: z.nativeEnum(QuestionType),
    text: z.string().trim().min(1, 'Текст вопроса обязателен').max(500),
    required: z.boolean().default(true),
    order: z.number().int().min(0),
    options: z.array(questionOptionInputSchema).max(50).optional(),
  })
  .superRefine((question, ctx) => {
    const isChoice =
      question.type === QuestionType.SINGLE_CHOICE ||
      question.type === QuestionType.MULTIPLE_CHOICE;
    if (isChoice && (!question.options || question.options.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'У вопроса с выбором должно быть минимум 2 варианта ответа',
        path: ['options'],
      });
    }
    if (!isChoice && question.options && question.options.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'У текстового вопроса не может быть вариантов ответа',
        path: ['options'],
      });
    }
  });
export type QuestionInput = z.infer<typeof questionInputSchema>;

function validateQuizCorrectness(
  survey: { isQuiz?: boolean; questions?: QuestionInput[] },
  ctx: z.RefinementCtx,
) {
  if (!survey.isQuiz || !survey.questions) return;
  survey.questions.forEach((question, index) => {
    const isChoice =
      question.type === QuestionType.SINGLE_CHOICE ||
      question.type === QuestionType.MULTIPLE_CHOICE;
    if (!isChoice) return;
    const correctCount = question.options?.filter((option) => option.isCorrect).length ?? 0;
    if (correctCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'В квиз-режиме отметьте хотя бы один правильный вариант',
        path: ['questions', index, 'options'],
      });
    }
    if (question.type === QuestionType.SINGLE_CHOICE && correctCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'У вопроса с одним вариантом ответа может быть только один правильный',
        path: ['questions', index, 'options'],
      });
    }
  });
}

const surveyBaseSchema = z.object({
  title: z.string().trim().min(3, 'Минимум 3 символа').max(200, 'Максимум 200 символов'),
  description: z.string().trim().max(2000).optional(),
  anonymityMode: z.nativeEnum(SurveyAnonymityMode),
  allowMultipleSubmissions: z.boolean().default(false),
  // datetime-local не даёт секунд/смещения, поэтому принимаем произвольную непустую строку
  // и парсим её как локальную дату уже на сервисном слое; '' трактуем как "без дедлайна".
  deadline: z
    .string()
    .nullish()
    .transform((value) => (value ? value : null)),
  isQuiz: z.boolean().default(false),
  questions: z.array(questionInputSchema).min(1, 'Добавьте хотя бы один вопрос').max(100),
});

export const createSurveySchema = surveyBaseSchema.superRefine(validateQuizCorrectness);
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;

export const updateSurveySchema = surveyBaseSchema
  .partial()
  .extend({ questions: z.array(questionInputSchema).min(1).max(100).optional() })
  .superRefine(validateQuizCorrectness);
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;

export const inviteToSurveySchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(200),
});
export type InviteToSurveyInput = z.infer<typeof inviteToSurveySchema>;

export const shareSurveyWithGroupSchema = z.object({
  groupId: z.string().uuid(),
});
export type ShareSurveyWithGroupInput = z.infer<typeof shareSurveyWithGroupSchema>;
