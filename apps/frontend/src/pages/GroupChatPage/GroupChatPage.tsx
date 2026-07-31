import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GroupDetailDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { useChatStore } from '@/entities/chat/model/chat.store';
import { getSocket } from '@/entities/chat/model/socket';
import { GroupMessages } from '@/widgets/GroupMessages';
import { GroupParticipants } from '@/widgets/GroupParticipants';
import { Card } from '@/shared/ui/Card';
import { PageHeading } from '@/shared/ui/PageHeading';
import { StateMessage } from '@/shared/ui/StateMessage';
import styles from './GroupChatPage.module.css';

export function GroupChatPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const setActiveGroup = useChatStore((state) => state.setActiveGroup);
  const markRead = useChatStore((state) => state.markRead);

  const [group, setGroup] = useState<GroupDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!groupId) return;
    try {
      setGroup(await api.get<GroupDetailDto>(`/groups/${groupId}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить группу');
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!groupId) return;
    setActiveGroup(groupId);
    void markRead(groupId);
    return () => setActiveGroup(null);
  }, [groupId, setActiveGroup, markRead]);

  useEffect(() => {
    if (!groupId) return;
    const socket = getSocket();
    if (!socket) return;

    const reload = () => void load();
    const events = [
      'member:added',
      'member:removed',
      'member:role-changed',
      'member:write-access-changed',
      'group:updated',
    ];
    events.forEach((event) => socket.on(event, reload));

    return () => {
      events.forEach((event) => socket.off(event, reload));
    };
  }, [groupId, load]);

  if (error) {
    return <StateMessage tone="error">{error}</StateMessage>;
  }

  if (!group || !currentUserId) {
    return <StateMessage>Загрузка…</StateMessage>;
  }

  const myMembership = group.members.find((member) => member.user.id === currentUserId);
  const canWrite = myMembership?.canWrite ?? false;
  const isAdmin = group.myRole === 'ADMIN';

  return (
    <div>
      <PageHeading eyebrow="Группа" title={group.name} />
      <Link to="/profile" className={styles.back}>
        ← Назад к группам
      </Link>
      {group.description && <p className={styles.description}>{group.description}</p>}

      <div className={styles.layout}>
        <Card className={styles.chatCard}>
          <GroupMessages
            groupId={group.id}
            currentUserId={currentUserId}
            canWrite={canWrite}
            isAdmin={isAdmin}
          />
        </Card>

        <Card>
          <h2 className={styles.sectionTitle}>Участники ({group.memberCount})</h2>
          <GroupParticipants
            group={group}
            currentUserId={currentUserId}
            onChange={() => void load()}
          />
        </Card>
      </div>
    </div>
  );
}
