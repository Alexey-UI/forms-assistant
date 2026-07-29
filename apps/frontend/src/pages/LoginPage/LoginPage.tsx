import { Link, useLocation } from 'react-router-dom';
import { LoginForm } from '@/features/auth/LoginForm';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const location = useLocation();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Вход</h1>
      <LoginForm />
      <p className={styles.switch}>
        Нет аккаунта?{' '}
        <Link to="/register" state={location.state}>
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
