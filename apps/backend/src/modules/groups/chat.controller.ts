import type { Request, Response } from 'express';
import * as chatService from './chat.service';
import { emitToGroup } from '../../lib/realtime';

export async function listMessagesHandler(req: Request, res: Response) {
  const result = await chatService.listMessages(
    req.params.id as string,
    req.userId as string,
    req.query,
  );
  res.json(result);
}

export async function sendMessageHandler(req: Request, res: Response) {
  const groupId = req.params.id as string;
  const message = await chatService.sendMessage(groupId, req.userId as string, req.body);
  emitToGroup(groupId, 'message:new', message);
  res.status(201).json(message);
}

export async function editMessageHandler(req: Request, res: Response) {
  const groupId = req.params.id as string;
  const message = await chatService.editMessage(
    groupId,
    req.userId as string,
    req.params.messageId as string,
    req.body,
  );
  emitToGroup(groupId, 'message:updated', message);
  res.json(message);
}

export async function deleteMessageHandler(req: Request, res: Response) {
  const groupId = req.params.id as string;
  const messageId = req.params.messageId as string;
  await chatService.deleteMessage(groupId, req.userId as string, messageId);
  emitToGroup(groupId, 'message:deleted', { groupId, messageId });
  res.status(204).send();
}

export async function markReadHandler(req: Request, res: Response) {
  await chatService.markRead(req.params.id as string, req.userId as string);
  res.status(204).send();
}

export async function getUnreadSummaryHandler(req: Request, res: Response) {
  res.json(await chatService.getUnreadSummary(req.userId as string));
}

export async function setMemberWriteAccessHandler(req: Request, res: Response) {
  const groupId = req.params.id as string;
  const targetUserId = req.params.userId as string;
  const canWrite = req.body.canWrite as boolean;
  await chatService.setMemberWriteAccess(groupId, req.userId as string, targetUserId, canWrite);
  emitToGroup(groupId, 'member:write-access-changed', { groupId, userId: targetUserId, canWrite });
  res.status(204).send();
}
