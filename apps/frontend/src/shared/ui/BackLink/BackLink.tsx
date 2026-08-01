import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './BackLink.module.css';

interface BackLinkProps {
  to: string;
  children: ReactNode;
}

export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link to={to} className={styles.back}>
      <span className={styles.arrow} aria-hidden="true">
        ←
      </span>
      {children}
    </Link>
  );
}
