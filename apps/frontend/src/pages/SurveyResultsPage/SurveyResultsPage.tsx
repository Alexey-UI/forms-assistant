import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { SurveyParticipantDto, SurveyResultsDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { SurveyResults } from '@/widgets/SurveyResults';
import { SurveyParticipants } from '@/widgets/SurveyParticipants';

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
    return <p>{error}</p>;
  }

  if (!results || !participants) {
    return <p>Загрузка…</p>;
  }

  return (
    <div>
      <h1>Результаты опроса</h1>
      <SurveyResults results={results} />
      <h2>Участники</h2>
      <SurveyParticipants participants={participants} />
    </div>
  );
}
