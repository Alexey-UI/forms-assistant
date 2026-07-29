import { Link } from 'react-router-dom';
import { useAuthStore } from '@/entities/auth/model/auth.store';
import { Button } from '@/shared/ui/Button';
import styles from './HomePage.module.css';

const FEATURES = [
  {
    title: 'Гибкий конструктор',
    text: 'Вопросы с одним или несколькими вариантами ответа, свободный текст, обязательные поля.',
  },
  {
    title: 'Друзья и группы',
    text: 'Делитесь опросами напрямую, по ссылке или сразу со всей группой.',
  },
  {
    title: 'Три режима анонимности',
    text: 'Полностью анонимно, публичный список участников без привязки ответов или именной опрос.',
  },
];

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  if (status === 'idle' || status === 'loading') {
    return null;
  }

  if (status === 'authenticated' && user) {
    return (
      <div className={styles.welcomeBack}>
        <span className={styles.eyebrow}>С возвращением</span>
        <h1>Привет, {user.displayName}!</h1>
        <p>Управляйте опросами, друзьями и группами в личном профиле.</p>
        <div className={styles.actions}>
          <Link to="/profile">
            <Button type="button">Перейти в профиль</Button>
          </Link>
          <Link to="/surveys/new">
            <Button type="button" variant="secondary">
              Создать опрос
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.hero}>
      <span className={styles.eyebrow}>Опросы для друзей и команд</span>
      <h1 className={styles.title}>Создавайте опросы, которым доверяют</h1>
      <p className={styles.subtitle}>
        Forms Assistant помогает быстро собрать обратную связь — с гибкой настройкой анонимности и
        удобным шерингом среди друзей и групп.
      </p>
      <div className={styles.actions}>
        <Link to="/register">
          <Button type="button">Начать бесплатно</Button>
        </Link>
        <Link to="/login">
          <Button type="button" variant="secondary">
            У меня есть аккаунт
          </Button>
        </Link>
      </div>

      <div className={styles.features}>
        {FEATURES.map((feature) => (
          <div key={feature.title} className={styles.feature}>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
