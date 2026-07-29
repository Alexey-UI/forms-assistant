import { useParams } from 'react-router-dom';

export function SurveyResultsPage() {
  const { surveyId } = useParams();
  return (
    <div>
      <h1>Результаты опроса</h1>
      <p>Опрос {surveyId} — агрегация и список участников появятся в рамках следующего этапа.</p>
    </div>
  );
}
