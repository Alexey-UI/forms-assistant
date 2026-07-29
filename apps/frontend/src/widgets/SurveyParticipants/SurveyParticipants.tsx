import type { SurveyParticipantDto } from '@forms-assistant/shared';
import { initials } from '@/shared/lib/initials';
import styles from './SurveyParticipants.module.css';

export function SurveyParticipants({ participants }: { participants: SurveyParticipantDto[] }) {
  if (participants.length === 0) {
    return <p className={styles.muted}>Пока никто не прошёл опрос.</p>;
  }

  return (
    <ul className={styles.list}>
      {participants.map((participant) => (
        <li key={participant.user.id} className={styles.item}>
          <span className={styles.name}>
            <span className={styles.avatar}>{initials(participant.user.displayName)}</span>
            {participant.user.displayName}
          </span>
          <span className={styles.muted}>
            {new Date(participant.completedAt).toLocaleString('ru-RU')}
          </span>
        </li>
      ))}
    </ul>
  );
}
