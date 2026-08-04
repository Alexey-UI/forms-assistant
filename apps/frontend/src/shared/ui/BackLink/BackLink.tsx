import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './BackLink.module.css';

interface BackLinkProps {
  to: string;
  children: ReactNode;
}

export function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link to={to} className={styles.back}>
      <ArrowLeft size={16} className={styles.arrow} aria-hidden="true" />
      {children}
    </Link>
  );
}
