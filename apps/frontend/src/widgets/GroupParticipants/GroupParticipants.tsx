import { useState } from 'react';
import type { GroupDetailDto, UserDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useUiStore } from '@/shared/model/ui.store';
import { useConfirmStore } from '@/shared/model/confirm.store';
import { initials } from '@/shared/lib/initials';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import styles from './GroupParticipants.module.css';

interface GroupParticipantsProps {
  group: GroupDetailDto;
  currentUserId: string;
  onChange: () => void;
}

export function GroupParticipants({ group, currentUserId, onChange }: GroupParticipantsProps) {
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<UserDto[]>([]);
  const notify = useUiStore((state) => state.notify);
  const confirmDialog = useConfirmStore((state) => state.confirm);

  const isAdmin = group.myRole === 'ADMIN';

  const withErrorHandling = async (action: () => Promise<void>, fallbackMessage: string) => {
    try {
      await action();
      onChange();
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : fallbackMessage);
    }
  };

  const searchUsers = async () => {
    if (inviteQuery.trim().length < 2) return;
    setInviteResults(
      await api.get<UserDto[]>(`/users/search?q=${encodeURIComponent(inviteQuery.trim())}`),
    );
  };

  const inviteUser = (userId: string) =>
    withErrorHandling(async () => {
      await api.post(`/groups/${group.id}/members`, { userId });
      notify('success', 'Участник добавлен');
      setInviteResults((prev) => prev.filter((user) => user.id !== userId));
    }, 'Не удалось добавить участника');

  const removeMember = async (userId: string) => {
    const confirmed = await confirmDialog('Удалить участника из группы?', {
      title: 'Удаление участника',
      confirmLabel: 'Удалить',
      danger: true,
    });
    if (!confirmed) return;
    await withErrorHandling(async () => {
      await api.delete(`/groups/${group.id}/members/${userId}`);
      notify('success', 'Участник удалён');
    }, 'Не удалось удалить участника');
  };

  const toggleRole = (userId: string, currentRole: 'ADMIN' | 'MEMBER') =>
    withErrorHandling(async () => {
      await api.patch(`/groups/${group.id}/members/${userId}`, {
        role: currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN',
      });
    }, 'Не удалось изменить роль');

  const toggleWriteAccess = (userId: string, canWrite: boolean) =>
    withErrorHandling(async () => {
      await api.patch(`/groups/${group.id}/members/${userId}/write-access`, {
        canWrite: !canWrite,
      });
    }, 'Не удалось изменить право писать');

  return (
    <div>
      {isAdmin && (
        <div className={styles.inviteForm}>
          <Input
            label="Пригласить в группу"
            value={inviteQuery}
            onChange={(e) => setInviteQuery(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={() => void searchUsers()}>
            Найти
          </Button>
        </div>
      )}

      {inviteResults.map((user) => (
        <div key={user.id} className={styles.inviteResult}>
          <span>
            {user.displayName} ({user.email})
          </span>
          <Button type="button" onClick={() => void inviteUser(user.id)}>
            Добавить
          </Button>
        </div>
      ))}

      <ul className={styles.list}>
        {group.members.map((member) => {
          const isSelf = member.user.id === currentUserId;
          return (
            <li key={member.user.id} className={styles.item}>
              <span className={styles.person}>
                <span className={styles.avatar}>{initials(member.user.displayName)}</span>
                <span>
                  <span className={styles.name}>
                    {member.user.displayName}
                    {isSelf && <span className={styles.muted}> (вы)</span>}
                  </span>
                  <div className={styles.badges}>
                    <span
                      className={`${styles.badge} ${member.role === 'ADMIN' ? styles.badgeAdmin : ''}`}
                    >
                      {member.role === 'ADMIN' ? 'админ' : 'участник'}
                    </span>
                    {!member.canWrite && <span className={styles.badgeMuted}>не может писать</span>}
                  </div>
                </span>
              </span>

              {isAdmin && !isSelf && (
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => void toggleRole(member.user.id, member.role)}
                  >
                    {member.role === 'ADMIN' ? 'Разжаловать' : 'Сделать админом'}
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => void toggleWriteAccess(member.user.id, member.canWrite)}
                  >
                    {member.canWrite ? 'Замьютить' : 'Размьютить'}
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.danger}`}
                    onClick={() => void removeMember(member.user.id)}
                  >
                    Удалить
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
