import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { NotificationsHost } from '@/shared/ui/NotificationsHost';
import { initials } from '@/shared/lib/initials';
import styles from './RootLayout.module.css';

export function RootLayout() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true" />
            Forms Assistant
          </Link>
          <nav className={styles.nav}>
            {status === 'authenticated' && user ? (
              <>
                <Link to="/surveys/new" className={styles.createLink}>
                  + Новый опрос
                </Link>
                <Link to="/profile" className={styles.profileLink}>
                  <span className={styles.avatar}>{initials(user.displayName)}</span>
                  <span className={styles.userName}>{user.displayName}</span>
                </Link>
                <button type="button" className={styles.logoutButton} onClick={() => void logout()}>
                  Выйти
                </button>
              </>
            ) : status === 'unauthenticated' ? (
              <>
                <Link to="/login" className={styles.textLink}>
                  Войти
                </Link>
                <Link to="/register" className={styles.registerButton}>
                  Регистрация
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main className={styles.content}>
        <Outlet />
      </main>
      <NotificationsHost />
    </div>
  );
}
