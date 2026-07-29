import { forwardRef, type SelectHTMLAttributes } from 'react';
import styles from '../Input/Input.module.css';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, children, ...rest },
  ref,
) {
  const selectId = id ?? rest.name;
  return (
    <div className={styles.field}>
      {label ? (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      ) : null}
      <select id={selectId} ref={ref} className={styles.input} {...rest}>
        {children}
      </select>
      {error ? <span className={styles.error}>{error}</span> : null}
    </div>
  );
});
