import { z } from 'zod';
import { QuestionType, SurveyAnonymityMode } from '../enums';

export const questionOptionInputSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().trim().min(1, 'Вариант не может быть пустым').max(300),
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

export const createSurveySchema = z.object({
  title: z.string().trim().min(3, 'Минимум 3 символа').max(200, 'Максимум 200 символов'),
  description: z.string().trim().max(2000).optional(),
  anonymityMode: z.nativeEnum(SurveyAnonymityMode),
  allowMultipleSubmissions: z.boolean().default(false),
  questions: z.array(questionInputSchema).min(1, 'Добавьте хотя бы один вопрос').max(100),
});
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;

export const updateSurveySchema = createSurveySchema.partial().extend({
  questions: z.array(questionInputSchema).min(1).max(100).optional(),
});
export type UpdateSurveyInput = z.infer<typeof updateSurveySchema>;

export const inviteToSurveySchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(200),
});
export type InviteToSurveyInput = z.infer<typeof inviteToSurveySchema>;

export const shareSurveyWithGroupSchema = z.object({
  groupId: z.string().uuid(),
});
export type ShareSurveyWithGroupInput = z.infer<typeof shareSurveyWithGroupSchema>;
