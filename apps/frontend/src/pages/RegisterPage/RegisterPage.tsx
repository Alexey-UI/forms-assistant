import { Link } from 'react-router-dom';
import { RegisterForm } from '@/features/auth/RegisterForm';

export function RegisterPage() {
  return (
    <div>
      <h1>Регистрация</h1>
      <RegisterForm />
      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
