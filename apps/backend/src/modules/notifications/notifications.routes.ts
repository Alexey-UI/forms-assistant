import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/async-handler';
import {
  getUnreadCountHandler,
  listNotificationsHandler,
  markAllReadHandler,
  markReadHandler,
} from './notifications.controller';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get('/', asyncHandler(listNotificationsHandler));
notificationsRouter.get('/unread-count', asyncHandler(getUnreadCountHandler));
notificationsRouter.post('/read-all', asyncHandler(markAllReadHandler));
notificationsRouter.post('/:id/read', asyncHandler(markReadHandler));
