import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AnswerInput, SurveyForTakingDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { TakeSurveyForm } from '@/features/survey/TakeSurveyForm';

export function SurveyTakePage() {
  const { token, surveyId } = useParams<{ token?: string; surveyId?: string }>();
  const user = useAuthStore((state) => state.user);
  const authStatus = useAuthStore((state) => state.status);
  const [survey, setSurvey] = useState<SurveyForTakingDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      await api.post(submitPath, { answers });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось отправить ответы');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return <p>{error}</p>;
  }

  if (!survey) {
    return <p>Загрузка…</p>;
  }

  if (submitted) {
    return <h1>Спасибо! Ваш ответ отправлен.</h1>;
  }

  if (survey.alreadySubmitted) {
    return <h1>Вы уже проходили этот опрос.</h1>;
  }

  if (survey.requiresAuth && !user) {
    return (
      <div>
        <h1>{survey.title}</h1>
        <p>
          Для прохождения этого опроса нужно войти в аккаунт. <Link to="/login">Войти</Link> или{' '}
          <Link to="/register">зарегистрироваться</Link>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>{survey.title}</h1>
      {survey.description && <p>{survey.description}</p>}
      <TakeSurveyForm
        questions={survey.questions}
        submitting={submitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
