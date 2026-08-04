import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { NotificationsHost } from '@/shared/ui/NotificationsHost';
import { ConfirmDialogHost } from '@/shared/ui/ConfirmDialogHost';
import { NotificationBell } from '@/widgets/NotificationBell';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { initials } from '@/shared/lib/initials';
import styles from './RootLayout.module.css';

export function RootLayout() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark} aria-hidden="true" />
            Forms Assistant
          </Link>

          <div className={styles.mobileControls}>
            {status === 'authenticated' && user && <NotificationBell />}
            <ThemeToggle />
            <button
              type="button"
              className={styles.menuToggle}
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
            <div className={styles.desktopThemeToggle}>
              <ThemeToggle />
            </div>
            {status === 'authenticated' && user ? (
              <>
                <div className={styles.desktopBell}>
                  <NotificationBell />
                </div>
                <Link to="/surveys/new" className={styles.createLink} onClick={closeMenu}>
                  + Новый опрос
                </Link>
                <Link to="/profile" className={styles.profileLink} onClick={closeMenu}>
                  <span className={styles.avatar}>{initials(user.displayName)}</span>
                  <span className={styles.userName}>{user.displayName}</span>
                </Link>
                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={() => {
                    closeMenu();
                    void logout();
                  }}
                >
                  Выйти
                </button>
              </>
            ) : status === 'unauthenticated' ? (
              <>
                <Link to="/login" className={styles.textLink} onClick={closeMenu}>
                  Войти
                </Link>
                <Link to="/register" className={styles.registerButton} onClick={closeMenu}>
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
      <ConfirmDialogHost />
    </div>
  );
}
