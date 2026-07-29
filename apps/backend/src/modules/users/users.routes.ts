import { Router } from 'express';
import { updateProfileSchema } from '@forms-assistant/shared';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/async-handler';
import {
  getMeHandler,
  getUserHandler,
  searchUsersHandler,
  updateMeHandler,
} from './users.controller';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get('/me', asyncHandler(getMeHandler));
usersRouter.patch('/me', validateBody(updateProfileSchema), asyncHandler(updateMeHandler));
usersRouter.get('/search', asyncHandler(searchUsersHandler));
usersRouter.get('/:id', asyncHandler(getUserHandler));
