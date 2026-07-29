import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { NotificationsHost } from '@/shared/ui/NotificationsHost';
import styles from './RootLayout.module.css';

export function RootLayout() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Forms Assistant
        </Link>
        <nav className={styles.nav}>
          {status === 'authenticated' && user ? (
            <>
              <Link to="/profile">{user.displayName}</Link>
              <button type="button" onClick={() => void logout()}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Войти</Link>
              <Link to="/register">Регистрация</Link>
            </>
          )}
        </nav>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
      <NotificationsHost />
    </div>
  );
}
