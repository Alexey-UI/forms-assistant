import { Link, useLocation } from 'react-router-dom';
import { RegisterForm } from '@/features/auth/RegisterForm';
import styles from './RegisterPage.module.css';

export function RegisterPage() {
  const location = useLocation();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Регистрация</h1>
      <RegisterForm />
      <p className={styles.switch}>
        Уже есть аккаунт?{' '}
        <Link to="/login" state={location.state}>
          Войти
        </Link>
      </p>
    </div>
  );
}
