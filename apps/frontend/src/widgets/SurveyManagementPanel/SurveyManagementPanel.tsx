import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type {
  GroupDto,
  RemindNonRespondentsResultDto,
  SurveyDetailDto,
  UserDto,
} from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { useUiStore } from '@/shared/model/ui.store';
import { env } from '@/shared/config/env';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Select } from '@/shared/ui/Select';
import styles from './SurveyManagementPanel.module.css';

interface SurveyManagementPanelProps {
  survey: SurveyDetailDto;
  onChange: () => void;
}

export function SurveyManagementPanel({ survey, onChange }: SurveyManagementPanelProps) {
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState<UserDto[]>([]);
  const [showQr, setShowQr] = useState(false);
  const notify = useUiStore((state) => state.notify);

  useEffect(() => {
    void api.get<GroupDto[]>('/groups').then(setGroups);
  }, []);

  const withErrorHandling = async (action: () => Promise<void>, fallbackMessage: string) => {
    try {
      await action();
      onChange();
    } catch (error) {
      notify('error', error instanceof ApiError ? error.message : fallbackMessage);
    }
  };

  const publish = () =>
    withErrorHandling(async () => {
      await api.post(`/surveys/${survey.id}/publish`);
      notify('success', 'Опрос опубликован');
    }, 'Не удалось опубликовать опрос');

  const close = () =>
    withErrorHandling(async () => {
      await api.post(`/surveys/${survey.id}/close`);
      notify('success', 'Опрос закрыт');
    }, 'Не удалось закрыть опрос');

  const generateLink = () =>
    withErrorHandling(async () => {
      await api.post(`/surveys/${survey.id}/share-link`);
    }, 'Не удалось создать ссылку');

  const shareWithGroup = () =>
    withErrorHandling(async () => {
      if (!selectedGroupId) return;
      await api.post(`/surveys/${survey.id}/share-group`, { groupId: selectedGroupId });
      notify('success', 'Опрос расшарен с группой');
    }, 'Не удалось расшарить опрос с группой');

  const exportCsv = async () => {
    try {
      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch(`${env.apiUrl}/surveys/${survey.id}/results/export`, {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!response.ok) {
        throw new Error('Не удалось скачать CSV');
      }
      const disposition = response.headers.get('content-disposition') ?? '';
      const utf8Match = /filename\*=UTF-8''([^;]+)/.exec(disposition);
      const filename = utf8Match ? decodeURIComponent(utf8Match[1]!) : `survey-${survey.id}.csv`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      notify('error', 'Не удалось скачать CSV');
    }
  };

  const remindNonRespondents = async () => {
    try {
      const result = await api.post<RemindNonRespondentsResultDto>(`/surveys/${survey.id}/remind`);
      notify(
        'success',
        result.remindedCount > 0
          ? `Напомнили ${result.remindedCount} участник(ам)`
          : 'Все уже прошли опрос',
      );
    } catch (error) {
      notify(
        'error',
        error instanceof ApiError ? error.message : 'Не удалось отправить напоминания',
      );
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
      await api.post(`/surveys/${survey.id}/invite`, { userIds: [userId] });
      notify('success', 'Пользователь приглашён');
      setInviteResults((prev) => prev.filter((user) => user.id !== userId));
    }, 'Не удалось пригласить пользователя');

  const shareUrl = survey.shareLinkToken
    ? `${window.location.origin}/s/${survey.shareLinkToken}`
    : null;

  const statusLabel: Record<SurveyDetailDto['status'], string> = {
    DRAFT: 'Черновик',
    PUBLISHED: 'Опубликован',
    CLOSED: 'Закрыт',
  };

  const statusBadgeClass: Record<SurveyDetailDto['status'], string> = {
    DRAFT: '',
    PUBLISHED: styles.status_PUBLISHED!,
    CLOSED: styles.status_CLOSED!,
  };

  return (
    <div className={styles.panel}>
      <div className={styles.statusRow}>
        <span className={`${styles.status} ${statusBadgeClass[survey.status]}`}>
          {statusLabel[survey.status]}
        </span>
        {survey.status === 'DRAFT' && <Button onClick={() => void publish()}>Опубликовать</Button>}
        {survey.status === 'PUBLISHED' && (
          <Button variant="danger" onClick={() => void close()}>
            Закрыть опрос
          </Button>
        )}
      </div>

      {survey.status !== 'DRAFT' && (
        <>
          <section className={styles.section}>
            <h3>Ссылка для прохождения</h3>
            {shareUrl ? (
              <>
                <div className={styles.linkRow}>
                  <p className={styles.link}>{shareUrl}</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      void navigator.clipboard.writeText(shareUrl);
                      notify('success', 'Ссылка скопирована');
                    }}
                  >
                    Копировать
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setShowQr((v) => !v)}>
                    {showQr ? 'Скрыть QR' : 'Показать QR'}
                  </Button>
                </div>
                {showQr && (
                  <div className={styles.qrBox}>
                    <QRCodeSVG value={shareUrl} size={160} />
                  </div>
                )}
              </>
            ) : (
              <Button variant="secondary" onClick={() => void generateLink()}>
                Создать ссылку
              </Button>
            )}
          </section>

          <section className={styles.section}>
            <h3>Пригласить пользователя</h3>
            <div className={styles.inviteForm}>
              <Input
                label="Email или имя"
                value={inviteQuery}
                onChange={(e) => setInviteQuery(e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={() => void searchUsers()}>
                Найти
              </Button>
            </div>
            {inviteResults.map((user) => (
              <div key={user.id} className={styles.inviteResult}>
                <span>
                  {user.displayName} ({user.email})
                </span>
                <Button type="button" onClick={() => void inviteUser(user.id)}>
                  Пригласить
                </Button>
              </div>
            ))}
          </section>

          {groups.length > 0 && (
            <section className={styles.section}>
              <h3>Расшарить с группой</h3>
              <div className={styles.inviteForm}>
                <Select
                  label="Группа"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                >
                  <option value="">Выберите группу</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </Select>
                <Button type="button" variant="secondary" onClick={() => void shareWithGroup()}>
                  Расшарить
                </Button>
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h3>Результаты</h3>
            <div className={styles.actionsRow}>
              <Button type="button" variant="secondary" onClick={() => void exportCsv()}>
                Скачать CSV
              </Button>
              {survey.status === 'PUBLISHED' && survey.anonymityMode !== 'ANONYMOUS' && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void remindNonRespondents()}
                >
                  Напомнить неответившим
                </Button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
