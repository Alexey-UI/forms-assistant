import { Router } from 'express';
import {
  addGroupMemberSchema,
  createGroupSchema,
  editGroupMessageSchema,
  listGroupMessagesQuerySchema,
  sendGroupMessageSchema,
  setMemberWriteAccessSchema,
  updateGroupMemberRoleSchema,
  updateGroupSchema,
} from '@forms-assistant/shared';
import { requireAuth } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';
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
import {
  deleteMessageHandler,
  editMessageHandler,
  getUnreadSummaryHandler,
  listMessagesHandler,
  markReadHandler,
  sendMessageHandler,
  setMemberWriteAccessHandler,
} from './chat.controller';

export const groupsRouter = Router();

groupsRouter.use(requireAuth);

groupsRouter.get('/', asyncHandler(listMyGroupsHandler));
groupsRouter.post('/', validateBody(createGroupSchema), asyncHandler(createGroupHandler));
groupsRouter.get('/unread-summary', asyncHandler(getUnreadSummaryHandler));
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
groupsRouter.patch(
  '/:id/members/:userId/write-access',
  validateBody(setMemberWriteAccessSchema),
  asyncHandler(setMemberWriteAccessHandler),
);

groupsRouter.get(
  '/:id/messages',
  validateQuery(listGroupMessagesQuerySchema),
  asyncHandler(listMessagesHandler),
);
groupsRouter.post(
  '/:id/messages',
  validateBody(sendGroupMessageSchema),
  asyncHandler(sendMessageHandler),
);
groupsRouter.patch(
  '/:id/messages/:messageId',
  validateBody(editGroupMessageSchema),
  asyncHandler(editMessageHandler),
);
groupsRouter.delete('/:id/messages/:messageId', asyncHandler(deleteMessageHandler));
groupsRouter.post('/:id/read', asyncHandler(markReadHandler));
