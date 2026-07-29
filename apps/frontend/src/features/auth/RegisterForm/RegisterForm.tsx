import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { registerSchema, type AuthResponseDto, type RegisterInput } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { resolveRedirectPath } from '@/shared/lib/redirect';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import styles from './RegisterForm.module.css';

export function RegisterForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await api.post<AuthResponseDto>('/auth/register', values);
      setSession(response.user, response.accessToken);
      navigate(resolveRedirectPath(location.state), { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось зарегистрироваться';
      setError('root', { message });
    }
  });

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Input
        label="Имя"
        autoComplete="name"
        {...register('displayName')}
        error={errors.displayName?.message}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <Input
        label="Пароль"
        type="password"
        autoComplete="new-password"
        {...register('password')}
        error={errors.password?.message}
      />
      {errors.root ? <p className={styles.formError}>{errors.root.message}</p> : null}
      <Button type="submit" disabled={isSubmitting} className={styles.submitButton}>
        {isSubmitting ? 'Регистрируем…' : 'Зарегистрироваться'}
      </Button>
    </form>
  );
}
