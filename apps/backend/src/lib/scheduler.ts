import { closeSurveysPastDeadline } from '../modules/surveys/surveys.service';
import { logger } from './logger';

const CHECK_INTERVAL_MS = 60_000;

export function startDeadlineScheduler(): NodeJS.Timeout {
  const run = () => {
    closeSurveysPastDeadline().catch((error: unknown) => {
      logger.error({ error }, 'Failed to auto-close surveys past deadline');
    });
  };
  run();
  return setInterval(run, CHECK_INTERVAL_MS);
}
