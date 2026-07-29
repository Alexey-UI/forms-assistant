import { useParams } from 'react-router-dom';

export function SurveyEditPage() {
  const { surveyId } = useParams();
  return (
    <div>
      <h1>Редактирование опроса</h1>
      <p>Опрос {surveyId} — редактор появится в рамках следующего этапа.</p>
    </div>
  );
}
