import { describe, expect, it } from 'vitest';
import { answerInputSchema, submitResponseSchema } from './response';

describe('answerInputSchema', () => {
  it('rejects an answer with neither selectedOptionIds nor textValue', () => {
    const result = answerInputSchema.safeParse({
      questionId: '11111111-1111-1111-1111-111111111111',
    });
    expect(result.success).toBe(false);
  });

  it('accepts an answer with only textValue', () => {
    const result = answerInputSchema.safeParse({
      questionId: '11111111-1111-1111-1111-111111111111',
      textValue: 'Ответ',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an answer with only selectedOptionIds', () => {
    const result = answerInputSchema.safeParse({
      questionId: '11111111-1111-1111-1111-111111111111',
      selectedOptionIds: ['22222222-2222-2222-2222-222222222222'],
    });
    expect(result.success).toBe(true);
  });
});

describe('submitResponseSchema', () => {
  it('requires at least one answer', () => {
    const result = submitResponseSchema.safeParse({ answers: [] });
    expect(result.success).toBe(false);
  });
});
