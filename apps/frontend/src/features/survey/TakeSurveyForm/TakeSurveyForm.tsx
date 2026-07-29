import { useState } from 'react';
import type { AnswerInput, QuestionDto } from '@forms-assistant/shared';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';
import styles from './TakeSurveyForm.module.css';

type AnswerValue = string | string[];

interface TakeSurveyFormProps {
  questions: QuestionDto[];
  submitting: boolean;
  onSubmit: (answers: AnswerInput[]) => Promise<void>;
}

export function TakeSurveyForm({ questions, submitting, onSubmit }: TakeSurveyFormProps) {
  const [values, setValues] = useState<Record<string, AnswerValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setValue = (questionId: string, value: AnswerValue) => {
    setValues((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleMultiple = (questionId: string, optionId: string) => {
    const current = (values[questionId] as string[] | undefined) ?? [];
    const next = current.includes(optionId)
      ? current.filter((id) => id !== optionId)
      : [...current, optionId];
    setValue(questionId, next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const answers: AnswerInput[] = [];

    for (const question of questions) {
      const raw = values[question.id];
      if (question.type === 'TEXT') {
        const textValue = typeof raw === 'string' ? raw.trim() : '';
        if (question.required && !textValue) {
          nextErrors[question.id] = 'Обязательный вопрос';
          continue;
        }
        if (textValue) {
          answers.push({ questionId: question.id, textValue });
        }
        continue;
      }

      const selected = Array.isArray(raw) ? raw : raw ? [raw] : [];
      if (question.required && selected.length === 0) {
        nextErrors[question.id] = 'Обязательный вопрос';
        continue;
      }
      if (selected.length > 0) {
        answers.push({ questionId: question.id, selectedOptionIds: selected });
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    await onSubmit(answers);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {questions.map((question) => (
        <div key={question.id} className={styles.question}>
          <p className={styles.questionText}>
            {question.text}
            {question.required && <span className={styles.required}> *</span>}
          </p>

          {question.type === 'TEXT' && (
            <Textarea
              label=""
              value={(values[question.id] as string) ?? ''}
              onChange={(e) => setValue(question.id, e.target.value)}
            />
          )}

          {question.type === 'SINGLE_CHOICE' &&
            question.options.map((option) => (
              <label key={option.id} className={styles.optionLabel}>
                <input
                  type="radio"
                  name={question.id}
                  checked={values[question.id] === option.id}
                  onChange={() => setValue(question.id, option.id)}
                />
                {option.text}
              </label>
            ))}

          {question.type === 'MULTIPLE_CHOICE' &&
            question.options.map((option) => (
              <label key={option.id} className={styles.optionLabel}>
                <input
                  type="checkbox"
                  checked={((values[question.id] as string[] | undefined) ?? []).includes(
                    option.id,
                  )}
                  onChange={() => toggleMultiple(question.id, option.id)}
                />
                {option.text}
              </label>
            ))}

          {errors[question.id] && <p className={styles.error}>{errors[question.id]}</p>}
        </div>
      ))}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Отправляем…' : 'Отправить ответы'}
      </Button>
    </form>
  );
}
