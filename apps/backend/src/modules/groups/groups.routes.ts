import { Router } from 'express';
import {
  addGroupMemberSchema,
  createGroupSchema,
  updateGroupMemberRoleSchema,
  updateGroupSchema,
} from '@forms-assistant/shared';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/async-handler';
import {
  addMemberHandler,
  createGroupHandler,
  deleteGroupHandler,
  getGroupHandler,
  listMyGroupsHandler,
  removeMemberHandler,
  updateGroupHandler,
  updateMemberRoleHandler,
} from './groups.controller';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

groupsRouter.get('/', asyncHandler(listMyGroupsHandler));
groupsRouter.post('/', validateBody(createGroupSchema), asyncHandler(createGroupHandler));
groupsRouter.get('/:id', asyncHandler(getGroupHandler));
groupsRouter.patch('/:id', validateBody(updateGroupSchema), asyncHandler(updateGroupHandler));
groupsRouter.delete('/:id', asyncHandler(deleteGroupHandler));
groupsRouter.post(
  '/:id/members',
  validateBody(addGroupMemberSchema),
  asyncHandler(addMemberHandler),
);
groupsRouter.delete('/:id/members/:userId', asyncHandler(removeMemberHandler));
groupsRouter.patch(
  '/:id/members/:userId',
  validateBody(updateGroupMemberRoleSchema),
  asyncHandler(updateMemberRoleHandler),
);
