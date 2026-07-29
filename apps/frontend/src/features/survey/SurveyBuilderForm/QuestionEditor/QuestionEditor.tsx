import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import type { CreateSurveyInput } from '@forms-assistant/shared';
import { QuestionType } from '@forms-assistant/shared';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import { Button } from '@/shared/ui/Button';
import styles from './QuestionEditor.module.css';

interface QuestionEditorProps {
  control: Control<CreateSurveyInput>;
  register: UseFormRegister<CreateSurveyInput>;
  errors: FieldErrors<CreateSurveyInput>;
  questionIndex: number;
  questionType: (typeof QuestionType)[keyof typeof QuestionType];
  onRemove: () => void;
  onTypeChange: (type: (typeof QuestionType)[keyof typeof QuestionType]) => void;
}

const TYPE_LABEL: Record<string, string> = {
  [QuestionType.SINGLE_CHOICE]: 'Один вариант',
  [QuestionType.MULTIPLE_CHOICE]: 'Несколько вариантов',
  [QuestionType.TEXT]: 'Текстовый ответ',
};

export function QuestionEditor({
  control,
  register,
  errors,
  questionIndex,
  questionType,
  onRemove,
  onTypeChange,
}: QuestionEditorProps) {
  const optionsArray = useFieldArray({ control, name: `questions.${questionIndex}.options` });
  const isChoice =
    questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.MULTIPLE_CHOICE;
  const questionErrors = errors.questions?.[questionIndex];

  return (
    <div className={styles.question}>
      <div className={styles.row}>
        <Input
          label={`Вопрос ${questionIndex + 1}`}
          {...register(`questions.${questionIndex}.text`)}
          error={questionErrors?.text?.message}
        />
        <Select
          label="Тип"
          value={questionType}
          onChange={(e) =>
            onTypeChange(e.target.value as (typeof QuestionType)[keyof typeof QuestionType])
          }
        >
          {Object.values(QuestionType).map((type) => (
            <option key={type} value={type}>
              {TYPE_LABEL[type]}
            </option>
          ))}
        </Select>
      </div>

      <label className={styles.checkbox}>
        <input type="checkbox" {...register(`questions.${questionIndex}.required`)} />
        Обязательный вопрос
      </label>

      {isChoice && (
        <div className={styles.options}>
          {optionsArray.fields.map((option, optionIndex) => (
            <div key={option.id} className={styles.optionRow}>
              <Input
                label={`Вариант ${optionIndex + 1}`}
                {...register(`questions.${questionIndex}.options.${optionIndex}.text`)}
                error={questionErrors?.options?.[optionIndex]?.text?.message}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => optionsArray.remove(optionIndex)}
                disabled={optionsArray.fields.length <= 2}
              >
                Удалить
              </Button>
            </div>
          ))}
          {typeof questionErrors?.options?.message === 'string' && (
            <p className={styles.error}>{questionErrors.options.message}</p>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={() => optionsArray.append({ text: '' })}
          >
            Добавить вариант
          </Button>
        </div>
      )}

      <Button type="button" variant="danger" onClick={onRemove} className={styles.removeQuestion}>
        Удалить вопрос
      </Button>
    </div>
  );
}
