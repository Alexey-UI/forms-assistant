import { forwardRef, type TextareaHTMLAttributes } from 'react';
import styles from '../Input/Input.module.css';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, ...rest },
  ref,
) {
  const textareaId = id ?? rest.name;
  return (
    <div className={styles.field}>
      <label htmlFor={textareaId} className={styles.label}>
        {label}
      </label>
      <textarea id={textareaId} ref={ref} className={styles.input} rows={3} {...rest} />
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
});
