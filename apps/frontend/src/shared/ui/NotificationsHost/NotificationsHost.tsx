import { useUiStore } from '@/shared/model/ui.store';
import styles from './NotificationsHost.module.css';

export function NotificationsHost() {
  const notifications = useUiStore((state) => state.notifications);
  const dismissNotification = useUiStore((state) => state.dismissNotification);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={styles.host}>
      {notifications.map((notification) => (
        <div key={notification.id} className={`${styles.item} ${styles[notification.type]}`}>
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => dismissNotification(notification.id)}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
