import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { SurveyDetailDto } from '@forms-assistant/shared';
import { api, ApiError } from '@/shared/api/client';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { useSurveysStore } from '@/entities/survey/model/surveys.store';
import { useUiStore } from '@/shared/model/ui.store';
import { SurveyList } from '@/widgets/SurveyList';
import { FriendsPanel } from '@/widgets/FriendsPanel';
import { GroupsPanel } from '@/widgets/GroupsPanel';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { PageHeading } from '@/shared/ui/PageHeading';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const mySurveys = useSurveysStore((state) => state.mySurveys);
  const sharedWithMe = useSurveysStore((state) => state.sharedWithMe);
  const fetchMySurveys = useSurveysStore((state) => state.fetchMySurveys);
  const fetchSharedWithMe = useSurveysStore((state) => state.fetchSharedWithMe);
  const notify = useUiStore((state) => state.notify);

  useEffect(() => {
    void fetchMySurveys();
    void fetchSharedWithMe();
  }, [fetchMySurveys, fetchSharedWithMe]);

  const duplicateSurvey = async (surveyId: string) => {
    try {
      const duplicate = await api.post<SurveyDetailDto>(`/surveys/${surveyId}/duplicate`);
      notify('success', 'Опрос продублирован как черновик');
      navigate(`/surveys/${duplicate.id}/edit`);
    } catch (error) {
      notify(
        'error',
        error instanceof ApiError ? error.message : 'Не удалось продублировать опрос',
      );
    }
  };

  return (
    <div className={styles.page}>
      <PageHeading eyebrow="Профиль" title={user?.displayName ?? 'Профиль'} />

      <Card className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Мои опросы</h2>
          <Link to="/surveys/new">
            <Button type="button">Создать опрос</Button>
          </Link>
        </div>
        <SurveyList
          surveys={mySurveys}
          emptyText="Вы ещё не создали ни одного опроса."
          renderActions={(survey) => (
            <>
              <Link to={`/surveys/${survey.id}/edit`}>
                <Button type="button" variant="secondary">
                  Редактировать
                </Button>
              </Link>
              <Link to={`/surveys/${survey.id}/results`}>
                <Button type="button" variant="secondary">
                  Результаты
                </Button>
              </Link>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void duplicateSurvey(survey.id)}
              >
                Клонировать
              </Button>
            </>
          )}
        />
      </Card>

      <Card className={styles.section}>
        <h2>Опросы, где я участник</h2>
        <SurveyList
          surveys={sharedWithMe}
          emptyText="Пока нет доступных опросов для прохождения."
          renderActions={(survey) => (
            <Link to={`/surveys/${survey.id}/take`}>
              <Button type="button">Пройти</Button>
            </Link>
          )}
        />
      </Card>

      <Card className={styles.section}>
        <h2>Друзья</h2>
        <FriendsPanel />
      </Card>

      <Card className={styles.section}>
        <h2>Группы</h2>
        <GroupsPanel />
      </Card>
    </div>
  );
}
