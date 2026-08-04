import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificationsStore } from '@/entities/notifications/model/notifications.store';
import styles from './NotificationBell.module.css';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationBell() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const markRead = useNotificationsStore((state) => state.markRead);
  const markAllRead = useNotificationsStore((state) => state.markAllRead);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = (id: string, read: boolean, link: string | null) => {
    if (!read) void markRead(id);
    setOpen(false);
    if (link) navigate(link);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Уведомления"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Уведомления</span>
            {unreadCount > 0 && (
              <button type="button" className={styles.markAll} onClick={() => void markAllRead()}>
                Прочитать всё
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className={styles.empty}>Пока нет уведомлений</p>
          ) : (
            <ul className={styles.list}>
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`${styles.item} ${notification.read ? '' : styles.unread}`}
                  onClick={() =>
                    handleItemClick(notification.id, notification.read, notification.link)
                  }
                >
                  <p className={styles.message}>{notification.message}</p>
                  <span className={styles.time}>{formatTime(notification.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
