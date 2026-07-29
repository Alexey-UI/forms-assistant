import { useParams } from 'react-router-dom';

export function SurveyTakePage() {
  const { token } = useParams();
  return (
    <div>
      <h1>Прохождение опроса</h1>
      <p>Ссылка {token} — страница прохождения появится в рамках следующего этапа.</p>
    </div>
  );
}
