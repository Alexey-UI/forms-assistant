import { describe, expect, it } from 'vitest';
import { questionInputSchema, createSurveySchema } from './survey';
import { QuestionType, SurveyAnonymityMode } from '../enums';

describe('questionInputSchema', () => {
  it('requires at least 2 options for a single-choice question', () => {
    const result = questionInputSchema.safeParse({
      type: QuestionType.SINGLE_CHOICE,
      text: 'Вопрос',
      required: true,
      order: 0,
      options: [{ text: 'Один вариант' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a single-choice question with 2 options', () => {
    const result = questionInputSchema.safeParse({
      type: QuestionType.SINGLE_CHOICE,
      text: 'Вопрос',
      required: true,
      order: 0,
      options: [{ text: 'Да' }, { text: 'Нет' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a text question that has options', () => {
    const result = questionInputSchema.safeParse({
      type: QuestionType.TEXT,
      text: 'Вопрос',
      required: true,
      order: 0,
      options: [{ text: 'Не должно быть' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a text question without options', () => {
    const result = questionInputSchema.safeParse({
      type: QuestionType.TEXT,
      text: 'Вопрос',
      required: false,
      order: 0,
    });
    expect(result.success).toBe(true);
  });
});

describe('createSurveySchema', () => {
  it('requires at least one question', () => {
    const result = createSurveySchema.safeParse({
      title: 'Опрос',
      anonymityMode: SurveyAnonymityMode.NAMED,
      allowMultipleSubmissions: false,
      questions: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a title shorter than 3 characters', () => {
    const result = createSurveySchema.safeParse({
      title: 'ab',
      anonymityMode: SurveyAnonymityMode.NAMED,
      allowMultipleSubmissions: false,
      questions: [{ type: QuestionType.TEXT, text: 'Вопрос', required: false, order: 0 }],
    });
    expect(result.success).toBe(false);
  });
});
