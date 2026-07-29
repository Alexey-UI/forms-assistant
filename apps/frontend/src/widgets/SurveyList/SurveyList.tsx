import type { ReactNode } from 'react';
import type { SurveySummaryDto } from '@forms-assistant/shared';
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
            <div className={styles.title}>{survey.title}</div>
            <div className={styles.meta}>
              {STATUS_LABEL[survey.status]} · {ANONYMITY_LABEL[survey.anonymityMode]} · ответов:{' '}
              {survey.responseCount}
            </div>
          </div>
          <div className={styles.actions}>{renderActions(survey)}</div>
        </li>
      ))}
    </ul>
  );
}
