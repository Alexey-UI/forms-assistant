import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { useSurveysStore } from '@/entities/survey/model/surveys.store';
import { SurveyList } from '@/widgets/SurveyList';
import { FriendsPanel } from '@/widgets/FriendsPanel';
import { GroupsPanel } from '@/widgets/GroupsPanel';
import { Button } from '@/shared/ui/Button';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const mySurveys = useSurveysStore((state) => state.mySurveys);
  const sharedWithMe = useSurveysStore((state) => state.sharedWithMe);
  const fetchMySurveys = useSurveysStore((state) => state.fetchMySurveys);
  const fetchSharedWithMe = useSurveysStore((state) => state.fetchSharedWithMe);

  useEffect(() => {
    void fetchMySurveys();
    void fetchSharedWithMe();
  }, [fetchMySurveys, fetchSharedWithMe]);

  return (
    <div className={styles.page}>
      <h1>Профиль{user ? `: ${user.displayName}` : ''}</h1>

      <section className={styles.section}>
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
            </>
          )}
        />
      </section>

      <section className={styles.section}>
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
      </section>

      <section className={styles.section}>
        <h2>Друзья</h2>
        <FriendsPanel />
      </section>

      <section className={styles.section}>
        <h2>Группы</h2>
        <GroupsPanel />
      </section>
    </div>
  );
}
