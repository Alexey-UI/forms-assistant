import { useEffect } from 'react';
import { useConfirmStore } from '@/shared/model/confirm.store';
import { Button } from '@/shared/ui/Button';
import styles from './ConfirmDialogHost.module.css';

export function ConfirmDialogHost() {
  const request = useConfirmStore((state) => state.request);
  const resolveRequest = useConfirmStore((state) => state.resolveRequest);

  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveRequest(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [request, resolveRequest]);

  if (!request) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={() => resolveRequest(false)}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={request.title ?? request.message}
        onClick={(e) => e.stopPropagation()}
      >
        {request.title && <h2 className={styles.title}>{request.title}</h2>}
        <p className={styles.message}>{request.message}</p>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={() => resolveRequest(false)}>
            {request.cancelLabel ?? 'Отмена'}
          </Button>
          <Button
            type="button"
            variant={request.danger ? 'danger' : 'primary'}
            onClick={() => resolveRequest(true)}
            autoFocus
          >
            {request.confirmLabel ?? 'Подтвердить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
