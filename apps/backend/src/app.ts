import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { env } from './config/env';
import { logger } from './lib/logger';
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { friendsRouter } from './modules/friends/friends.routes';
import { groupsRouter } from './modules/groups/groups.routes';
import { surveysRouter } from './modules/surveys/surveys.routes';
import { publicSurveyRouter } from './modules/responses/public.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/friends', friendsRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/surveys', surveysRouter);
  app.use('/api/s', publicSurveyRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
