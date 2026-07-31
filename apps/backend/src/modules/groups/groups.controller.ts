import type { Request, Response } from 'express';
import * as groupsService from './groups.service';
import { emitToGroup, emitToUser, joinUserToGroup, removeUserFromGroup } from '../../lib/realtime';

export async function createGroupHandler(req: Request, res: Response) {
  const group = await groupsService.createGroup(req.userId as string, req.body);
  res.status(201).json(group);
}

export async function listMyGroupsHandler(req: Request, res: Response) {
  res.json(await groupsService.listMyGroups(req.userId as string));
}

export async function getGroupHandler(req: Request, res: Response) {
  res.json(await groupsService.getGroupDetail(req.params.id as string, req.userId as string));
}

export async function updateGroupHandler(req: Request, res: Response) {
  const group = await groupsService.updateGroup(
    req.params.id as string,
    req.userId as string,
    req.body,
  );
  emitToGroup(group.id, 'group:updated', group);
  res.json(group);
}

export async function deleteGroupHandler(req: Request, res: Response) {
  const groupId = req.params.id as string;
  await groupsService.deleteGroup(groupId, req.userId as string);
  emitToGroup(groupId, 'group:deleted', { groupId });
  res.status(204).send();
}

export async function addMemberHandler(req: Request, res: Response) {
  const groupId = req.params.id as string;
  const newUserId = req.body.userId as string;
  const group = await groupsService.addMember(groupId, req.userId as string, newUserId);

  await joinUserToGroup(newUserId, groupId);
  emitToGroup(groupId, 'member:added', group);
  emitToUser(newUserId, 'group:added', group);

  res.status(201).json(group);
}

export async function removeMemberHandler(req: Request, res: Response) {
  const groupId = req.params.id as string;
  const targetUserId = req.params.userId as string;
  await groupsService.removeMember(groupId, req.userId as string, targetUserId);

  emitToGroup(groupId, 'member:removed', { groupId, userId: targetUserId });
  emitToUser(targetUserId, 'group:removed', { groupId });
  await removeUserFromGroup(targetUserId, groupId);

  res.status(204).send();
}

export async function updateMemberRoleHandler(req: Request, res: Response) {
  const groupId = req.params.id as string;
  const group = await groupsService.updateMemberRole(
    groupId,
    req.userId as string,
    req.params.userId as string,
    req.body.role,
  );
  emitToGroup(groupId, 'member:role-changed', group);
  res.json(group);
}
