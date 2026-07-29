import type { ReactNode } from 'react';
import styles from './StateMessage.module.css';

interface StateMessageProps {
  tone?: 'muted' | 'error';
  children: ReactNode;
}

export function StateMessage({ tone = 'muted', children }: StateMessageProps) {
  return (
    <div className={`${styles.message} ${tone === 'error' ? styles.error : ''}`}>{children}</div>
  );
}
