import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import type {
  AnswerInput,
  SubmitResponseResultDto,
  SurveyForTakingDto,
} from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { TakeSurveyForm } from '@/features/survey/TakeSurveyForm';
import { Card } from '@/shared/ui/Card';
import { StateMessage } from '@/shared/ui/StateMessage';
import styles from './SurveyTakePage.module.css';

export function SurveyTakePage() {
  const { token, surveyId } = useParams<{ token?: string; surveyId?: string }>();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);
  const [survey, setSurvey] = useState<SurveyForTakingDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SubmitResponseResultDto | null>(null);

  const basePath = token ? `/s/${token}` : `/surveys/${surveyId}/take`;
  const submitPath = token ? `/s/${token}/responses` : `/surveys/${surveyId}/responses`;

  const load = useCallback(async () => {
    try {
      setSurvey(await api.get<SurveyForTakingDto>(basePath));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось загрузить опрос');
    }
  }, [basePath]);

  useEffect(() => {
    if (authStatus === 'idle' || authStatus === 'loading') {
      return;
    }
    void load();
  }, [load, authStatus]);

  const handleSubmit = async (answers: AnswerInput[]) => {
    setSubmitting(true);
    try {
      setResult(await api.post<SubmitResponseResultDto>(submitPath, { answers }));
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось отправить ответы');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return <StateMessage tone="error">{error}</StateMessage>;
  }

  if (!survey) {
    return <StateMessage>Загрузка…</StateMessage>;
  }

  if (submitted) {
    return (
      <div className={styles.page}>
        <Card className={styles.centerCard}>
          <span className={styles.successIcon}>
            <Check size={28} strokeWidth={2.5} />
          </span>
          <h1>Спасибо!</h1>
          <p>Ваш ответ отправлен.</p>
          {result?.score !== null && result?.score !== undefined && (
            <p className={styles.score}>
              Вы набрали {result.score} из {result.maxScore}
            </p>
          )}
        </Card>
      </div>
    );
  }

  if (survey.alreadySubmitted) {
    return (
      <div className={styles.page}>
        <Card className={styles.centerCard}>
          <h1>{survey.title}</h1>
          <p>Вы уже проходили этот опрос.</p>
        </Card>
      </div>
    );
  }

  if (survey.requiresAuth && !user) {
    return (
      <div className={styles.page}>
        <Card className={styles.centerCard}>
          <h1>{survey.title}</h1>
          <p>
            Для прохождения этого опроса нужно войти в аккаунт.{' '}
            <Link to="/login" state={{ from: location }}>
              Войти
            </Link>{' '}
            или{' '}
            <Link to="/register" state={{ from: location }}>
              зарегистрироваться
            </Link>
            .
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Card>
        <h1>{survey.title}</h1>
        {survey.description && <p className={styles.description}>{survey.description}</p>}
        <TakeSurveyForm
          questions={survey.questions}
          submitting={submitting}
          onSubmit={handleSubmit}
        />
      </Card>
    </div>
  );
}
