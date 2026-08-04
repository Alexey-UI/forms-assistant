import type { ReactNode } from 'react';
import type { SurveySummaryDto } from '@forms-assistant/shared';
import { formatDateTime } from '@/shared/lib/datetime';
import styles from './SurveyList.module.css';

const ANONYMITY_LABEL: Record<SurveySummaryDto['anonymityMode'], string> = {
  ANONYMOUS: 'Анонимный',
  PUBLIC_LIST: 'Публичный список',
  NAMED: 'Именной',
};

const STATUS_LABEL: Record<SurveySummaryDto['status'], string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликован',
  CLOSED: 'Закрыт',
};

const STATUS_BADGE_CLASS: Record<SurveySummaryDto['status'], string> = {
  DRAFT: styles.badgeDraft!,
  PUBLISHED: styles.badgePublished!,
  CLOSED: styles.badgeClosed!,
};

interface SurveyListProps {
  surveys: SurveySummaryDto[];
  emptyText: string;
  renderActions: (survey: SurveySummaryDto) => ReactNode;
}

export function SurveyList({ surveys, emptyText, renderActions }: SurveyListProps) {
  if (surveys.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <ul className={styles.list}>
      {surveys.map((survey) => (
        <li key={survey.id} className={styles.item}>
          <div>
            <div className={styles.titleRow}>
              <span className={styles.title}>{survey.title}</span>
              <span className={`${styles.badge} ${STATUS_BADGE_CLASS[survey.status]}`}>
                {STATUS_LABEL[survey.status]}
              </span>
            </div>
            <div className={styles.meta}>
              {ANONYMITY_LABEL[survey.anonymityMode]} · ответов: {survey.responseCount}
              {survey.isQuiz && ' · квиз'}
              {survey.deadline && ` · дедлайн: ${formatDateTime(survey.deadline)}`}
            </div>
          </div>
          <div className={styles.actions}>{renderActions(survey)}</div>
        </li>
      ))}
    </ul>
  );
}
