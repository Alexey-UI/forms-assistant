import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSurveySchema,
  QuestionType,
  SurveyAnonymityMode,
  type CreateSurveyInput,
} from '@forms-assistant/shared';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import { QuestionEditor } from './QuestionEditor';
import styles from './SurveyBuilderForm.module.css';

const ANONYMITY_LABEL: Record<SurveyAnonymityMode, string> = {
  ANONYMOUS: 'Полностью анонимный',
  PUBLIC_LIST: 'Публичный список участников',
  NAMED: 'Именной',
};

function emptyQuestion(order: number): CreateSurveyInput['questions'][number] {
  return {
    type: QuestionType.SINGLE_CHOICE,
    text: '',
    required: true,
    order,
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  };
}

interface SurveyBuilderFormProps {
  defaultValues?: CreateSurveyInput;
  submitLabel: string;
  locked?: boolean;
  onSubmit: (values: CreateSurveyInput) => Promise<void>;
}

const DEFAULT_VALUES: CreateSurveyInput = {
  title: '',
  description: '',
  anonymityMode: SurveyAnonymityMode.NAMED,
  allowMultipleSubmissions: false,
  deadline: '',
  isQuiz: false,
  questions: [emptyQuestion(0)],
};

export function SurveyBuilderForm({
  defaultValues,
  submitLabel,
  locked,
  onSubmit,
}: SurveyBuilderFormProps) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateSurveyInput>({
    resolver: zodResolver(createSurveySchema),
    defaultValues: defaultValues ?? DEFAULT_VALUES,
  });

  const questionsArray = useFieldArray({ control, name: 'questions' });
  const questionTypes = watch('questions').map((question) => question.type);
  const isQuiz = watch('isQuiz');

  const handleTypeChange = (
    questionIndex: number,
    type: (typeof QuestionType)[keyof typeof QuestionType],
  ) => {
    setValue(`questions.${questionIndex}.type`, type);
    const isChoice = type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE;
    if (!isChoice) {
      setValue(`questions.${questionIndex}.options`, undefined);
    } else {
      const current = watch(`questions.${questionIndex}.options`) ?? [];
      if (current.length < 2) {
        setValue(`questions.${questionIndex}.options`, [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]);
      }
    }
  };

  const submit = handleSubmit(onSubmit);

  return (
    <form onSubmit={submit} className={styles.form} noValidate>
      <Input label="Название опроса" {...register('title')} error={errors.title?.message} />
      <Textarea
        label="Описание (необязательно)"
        {...register('description')}
        error={errors.description?.message}
      />
      <Select
        label="Режим анонимности"
        {...register('anonymityMode')}
        error={errors.anonymityMode?.message}
        disabled={locked}
      >
        {Object.values(SurveyAnonymityMode).map((mode) => (
          <option key={mode} value={mode}>
            {ANONYMITY_LABEL[mode]}
          </option>
        ))}
      </Select>
      <label className={styles.checkbox}>
        <input type="checkbox" {...register('allowMultipleSubmissions')} />
        Разрешить проходить опрос повторно
      </label>
      <Input
        type="datetime-local"
        label="Дедлайн (необязательно)"
        {...register('deadline')}
        error={typeof errors.deadline?.message === 'string' ? errors.deadline.message : undefined}
      />
      <label className={styles.checkbox}>
        <input type="checkbox" {...register('isQuiz')} disabled={locked} />
        Квиз-режим (с подсчётом баллов за правильные ответы)
      </label>

      <h2>Вопросы</h2>
      {locked && (
        <p className={styles.lockedNotice}>Опрос уже опубликован — вопросы менять нельзя.</p>
      )}
      {questionsArray.fields.map((field, index) =>
        locked ? null : (
          <QuestionEditor
            key={field.id}
            control={control}
            register={register}
            errors={errors}
            questionIndex={index}
            questionType={questionTypes[index] ?? QuestionType.SINGLE_CHOICE}
            isQuiz={isQuiz}
            onRemove={() => questionsArray.remove(index)}
            onTypeChange={(type) => handleTypeChange(index, type)}
          />
        ),
      )}
      {typeof errors.questions?.message === 'string' && (
        <p className={styles.error}>{errors.questions.message}</p>
      )}

      {!locked && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => questionsArray.append(emptyQuestion(questionsArray.fields.length))}
        >
          Добавить вопрос
        </Button>
      )}

      <div className={styles.submitRow}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Сохраняем…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
