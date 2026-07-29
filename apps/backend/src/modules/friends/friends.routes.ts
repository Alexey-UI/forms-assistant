import { Router } from 'express';
import { respondFriendRequestSchema, sendFriendRequestSchema } from '@forms-assistant/shared';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/async-handler';
import {
  listFriendRequestsHandler,
  listFriendsHandler,
  removeFriendHandler,
  respondFriendRequestHandler,
  sendFriendRequestHandler,
} from './friends.controller';

export const friendsRouter = Router();

friendsRouter.use(requireAuth);

friendsRouter.get('/', asyncHandler(listFriendsHandler));
friendsRouter.delete('/:userId', asyncHandler(removeFriendHandler));
friendsRouter.get('/requests', asyncHandler(listFriendRequestsHandler));
friendsRouter.post(
  '/requests',
  validateBody(sendFriendRequestSchema),
  asyncHandler(sendFriendRequestHandler),
);
friendsRouter.patch(
  '/requests/:id',
  validateBody(respondFriendRequestSchema),
  asyncHandler(respondFriendRequestHandler),
);
