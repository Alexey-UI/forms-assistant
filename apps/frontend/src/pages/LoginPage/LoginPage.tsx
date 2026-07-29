import { Link } from 'react-router-dom';
import { LoginForm } from '@/features/auth/LoginForm';

export function LoginPage() {
  return (
    <div>
      <h1>Вход</h1>
      <LoginForm />
      <p>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
