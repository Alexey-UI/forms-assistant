import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/entities/chat/model/chat.store';
import { useUiStore } from '@/shared/model/ui.store';
import { useConfirmStore } from '@/shared/model/confirm.store';
import { ApiError } from '@/shared/api/client';
import { initials } from '@/shared/lib/initials';
import { Button } from '@/shared/ui/Button';
import styles from './GroupMessages.module.css';

interface GroupMessagesProps {
  groupId: string;
  currentUserId: string;
  canWrite: boolean;
  isAdmin: boolean;
}

const EMPTY_MESSAGES: never[] = [];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function GroupMessages({ groupId, currentUserId, canWrite, isAdmin }: GroupMessagesProps) {
  const messages = useChatStore((state) => state.messagesByGroup[groupId] ?? EMPTY_MESSAGES);
  const nextCursor = useChatStore((state) => state.nextCursorByGroup[groupId]);
  const loading = useChatStore((state) => state.loadingByGroup[groupId] ?? false);
  const loadMessages = useChatStore((state) => state.loadMessages);
  const loadMoreMessages = useChatStore((state) => state.loadMoreMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const editMessage = useChatStore((state) => state.editMessage);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const notify = useUiStore((state) => state.notify);
  const confirmDialog = useConfirmStore((state) => state.confirm);

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const listRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useRef<string | null>(null);

  useEffect(() => {
    void loadMessages(groupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.id !== lastMessageId.current) {
      lastMessageId.current = last.id;
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await sendMessage(groupId, trimmed);
      setText('');
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const startEdit = (messageId: string, currentText: string) => {
    setEditingId(messageId);
    setEditingText(currentText);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const trimmed = editingText.trim();
    if (!trimmed) return;
    try {
      await editMessage(groupId, editingId, trimmed);
      setEditingId(null);
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Не удалось изменить сообщение');
    }
  };

  const handleDelete = async (messageId: string) => {
    const confirmed = await confirmDialog('Удалить сообщение?', {
      title: 'Удаление сообщения',
      confirmLabel: 'Удалить',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await deleteMessage(groupId, messageId);
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : 'Не удалось удалить сообщение');
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.list} ref={listRef}>
        {nextCursor && (
          <button
            type="button"
            className={styles.loadMore}
            onClick={() => void loadMoreMessages(groupId)}
            disabled={loading}
          >
            {loading ? 'Загрузка…' : 'Загрузить ещё'}
          </button>
        )}

        {messages.length === 0 && !loading && (
          <p className={styles.empty}>Сообщений пока нет — напишите первым.</p>
        )}

        {messages.map((message) => {
          const isOwn = message.author.id === currentUserId;
          const canModify = isOwn || isAdmin;
          const isEditing = editingId === message.id;

          return (
            <div key={message.id} className={`${styles.message} ${isOwn ? styles.own : ''}`}>
              <span className={styles.avatar}>{initials(message.author.displayName)}</span>
              <div className={styles.bubble}>
                <div className={styles.meta}>
                  <span className={styles.author}>{message.author.displayName}</span>
                  <span className={styles.time}>
                    {formatTime(message.createdAt)}
                    {message.editedAt && ' · ред.'}
                  </span>
                </div>

                {isEditing ? (
                  <div className={styles.editRow}>
                    <textarea
                      className={styles.editInput}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={2}
                    />
                    <div className={styles.editActions}>
                      <Button type="button" onClick={() => void saveEdit()}>
                        Сохранить
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className={styles.text}>{message.text}</p>
                )}

                {canModify && !isEditing && (
                  <div className={styles.actions}>
                    {isOwn && (
                      <button
                        type="button"
                        className={styles.actionButton}
                        onClick={() => startEdit(message.id, message.text)}
                      >
                        Изменить
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => void handleDelete(message.id)}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className={styles.composer}>
        {canWrite ? (
          <>
            <textarea
              className={styles.composerInput}
              placeholder="Написать сообщение…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend(e);
                }
              }}
              rows={1}
            />
            <Button type="submit" disabled={sending || !text.trim()}>
              Отправить
            </Button>
          </>
        ) : (
          <p className={styles.mutedNotice}>Администратор запретил вам писать в этой группе.</p>
        )}
      </form>
    </div>
  );
}
