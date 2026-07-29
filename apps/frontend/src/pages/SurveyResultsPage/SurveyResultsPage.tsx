import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { SurveyParticipantDto, SurveyResultsDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { SurveyResults } from '@/widgets/SurveyResults';
import { SurveyParticipants } from '@/widgets/SurveyParticipants';
import { Card } from '@/shared/ui/Card';
import { PageHeading } from '@/shared/ui/PageHeading';
import { StateMessage } from '@/shared/ui/StateMessage';
import styles from './SurveyResultsPage.module.css';

export function SurveyResultsPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [results, setResults] = useState<SurveyResultsDto | null>(null);
  const [participants, setParticipants] = useState<SurveyParticipantDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!surveyId) return;
    Promise.all([
      api.get<SurveyResultsDto>(`/surveys/${surveyId}/results`),
      api.get<SurveyParticipantDto[]>(`/surveys/${surveyId}/participants`),
    ])
      .then(([resultsData, participantsData]) => {
        setResults(resultsData);
        setParticipants(participantsData);
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : 'Не удалось загрузить результаты'),
      );
  }, [surveyId]);

  if (error) {
    return <StateMessage tone="error">{error}</StateMessage>;
  }

  if (!results || !participants) {
    return <StateMessage>Загрузка…</StateMessage>;
  }

  return (
    <div className={styles.page}>
      <PageHeading eyebrow="Результаты" title="Результаты опроса" />
      <Card className={styles.section}>
        <SurveyResults results={results} />
      </Card>
      <Card className={styles.section}>
        <h2>Участники</h2>
        <SurveyParticipants participants={participants} />
      </Card>
    </div>
  );
}
