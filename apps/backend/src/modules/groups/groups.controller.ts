import type { Request, Response } from 'express';
import * as groupsService from './groups.service';

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
  res.json(
    await groupsService.updateGroup(req.params.id as string, req.userId as string, req.body),
  );
}

export async function deleteGroupHandler(req: Request, res: Response) {
  await groupsService.deleteGroup(req.params.id as string, req.userId as string);
  res.status(204).send();
}

export async function addMemberHandler(req: Request, res: Response) {
  const group = await groupsService.addMember(
    req.params.id as string,
    req.userId as string,
    req.body.userId,
  );
  res.status(201).json(group);
}

export async function removeMemberHandler(req: Request, res: Response) {
  await groupsService.removeMember(
    req.params.id as string,
    req.userId as string,
    req.params.userId as string,
  );
  res.status(204).send();
}

export async function updateMemberRoleHandler(req: Request, res: Response) {
  const group = await groupsService.updateMemberRole(
    req.params.id as string,
    req.userId as string,
    req.params.userId as string,
    req.body.role,
  );
  res.json(group);
}
