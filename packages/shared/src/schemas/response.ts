import { z } from 'zod';

export const answerInputSchema = z
  .object({
    questionId: z.string().uuid(),
    selectedOptionIds: z.array(z.string().uuid()).optional(),
    textValue: z.string().trim().max(5000).optional(),
  })
  .refine((answer) => answer.selectedOptionIds !== undefined || answer.textValue !== undefined, {
    message: 'Ответ должен содержать выбранные варианты или текст',
  });
export type AnswerInput = z.infer<typeof answerInputSchema>;

export const submitResponseSchema = z.object({
  answers: z.array(answerInputSchema).min(1, 'Ответьте хотя бы на один вопрос'),
});
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
