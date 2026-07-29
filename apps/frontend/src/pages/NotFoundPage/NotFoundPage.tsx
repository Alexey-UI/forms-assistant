import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <span className={styles.code}>404</span>
      <h1>Страница не найдена</h1>
      <p>Проверьте адрес или вернитесь на главную.</p>
      <Link to="/">
        <Button type="button">На главную</Button>
      </Link>
    </div>
  );
}
