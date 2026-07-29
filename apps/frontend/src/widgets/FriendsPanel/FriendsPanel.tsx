import { useEffect, useState } from 'react';
import type { FriendRequestDto, UserDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useUiStore } from '@/shared/model/ui.store';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import styles from './FriendsPanel.module.css';

export function FriendsPanel() {
  const [friends, setFriends] = useState<UserDto[]>([]);
  const [incoming, setIncoming] = useState<FriendRequestDto[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserDto[]>([]);
  const [searching, setSearching] = useState(false);
  const notify = useUiStore((state) => state.notify);

  const loadFriends = async () => {
    const [friendsList, requests] = await Promise.all([
      api.get<UserDto[]>('/friends'),
      api.get<FriendRequestDto[]>('/friends/requests?direction=incoming'),
    ]);
    setFriends(friendsList);
    setIncoming(requests);
  };

  useEffect(() => {
    void loadFriends();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      return;
    }
    setSearching(true);
    try {
      const found = await api.get<UserDto[]>(`/users/search?q=${encodeURIComponent(query.trim())}`);
      setResults(found);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (userId: string) => {
    try {
      await api.post('/friends/requests', { targetUserId: userId });
      notify('success', 'Заявка отправлена');
      setResults((prev) => prev.filter((user) => user.id !== userId));
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Не удалось отправить заявку');
    }
  };

  const respond = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    await api.patch(`/friends/requests/${requestId}`, { action });
    await loadFriends();
  };

  return (
    <div>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <Input
          label="Найти пользователя по email или имени"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={searching}>
          Найти
        </Button>
      </form>

      {results.length > 0 && (
        <ul className={styles.list}>
          {results.map((user) => (
            <li key={user.id} className={styles.item}>
              <span>
                {user.displayName} <span className={styles.muted}>({user.email})</span>
              </span>
              <Button type="button" onClick={() => void sendRequest(user.id)}>
                Добавить
              </Button>
            </li>
          ))}
        </ul>
      )}

      {incoming.length > 0 && (
        <>
          <h3>Входящие заявки</h3>
          <ul className={styles.list}>
            {incoming.map((request) => (
              <li key={request.id} className={styles.item}>
                <span>{request.fromUser.displayName}</span>
                <div className={styles.actions}>
                  <Button type="button" onClick={() => void respond(request.id, 'ACCEPT')}>
                    Принять
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void respond(request.id, 'DECLINE')}
                  >
                    Отклонить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Друзья</h3>
      {friends.length === 0 ? (
        <p className={styles.muted}>Пока нет друзей — найдите кого-нибудь выше.</p>
      ) : (
        <ul className={styles.list}>
          {friends.map((friend) => (
            <li key={friend.id} className={styles.item}>
              <span>{friend.displayName}</span>
              <span className={styles.muted}>{friend.email}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
