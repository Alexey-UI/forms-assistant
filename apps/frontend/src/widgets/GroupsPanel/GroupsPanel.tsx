import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GroupDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useUiStore } from '@/shared/model/ui.store';
import { useChatStore } from '@/entities/chat/model/chat.store';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import styles from './GroupsPanel.module.css';

export function GroupsPanel() {
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const notify = useUiStore((state) => state.notify);
  const unreadByGroup = useChatStore((state) => state.unreadByGroup);

  const loadGroups = async () => {
    setGroups(await api.get<GroupDto[]>('/groups'));
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      return;
    }
    setCreating(true);
    try {
      await api.post('/groups', { name: name.trim() });
      setName('');
      await loadGroups();
      notify('success', 'Группа создана');
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Не удалось создать группу');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleCreate} className={styles.createForm}>
        <Input label="Новая группа" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={creating}>
          Создать
        </Button>
      </form>

      {groups.length === 0 ? (
        <p className={styles.muted}>Групп пока нет.</p>
      ) : (
        <ul className={styles.list}>
          {groups.map((group) => {
            const unreadCount = unreadByGroup[group.id] ?? group.unreadCount;
            return (
              <li key={group.id} className={styles.item}>
                <Link to={`/groups/${group.id}`} className={styles.groupInfo}>
                  <span className={styles.groupIcon}>{group.name[0]?.toUpperCase()}</span>
                  <span>
                    <span className={styles.name}>
                      {group.name}
                      {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
                    </span>
                    <span className={styles.muted}> · {group.memberCount} участников</span>
                  </span>
                </Link>
                <span
                  className={`${styles.roleBadge} ${group.myRole === 'ADMIN' ? styles.roleAdmin : ''}`}
                >
                  {group.myRole === 'ADMIN' ? 'админ' : 'участник'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
