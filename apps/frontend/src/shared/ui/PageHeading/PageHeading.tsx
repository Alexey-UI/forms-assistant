import type { ReactNode } from 'react';
import styles from './PageHeading.module.css';

interface PageHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  actions?: ReactNode;
}

export function PageHeading({ eyebrow, title, actions }: PageHeadingProps) {
  return (
    <div className={styles.heading}>
      <div>
        {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
