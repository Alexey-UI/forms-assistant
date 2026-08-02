import type { Request, Response } from 'express';
import * as notificationsService from './notifications.service';

export async function listNotificationsHandler(req: Request, res: Response) {
  res.json(await notificationsService.listNotifications(req.userId as string));
}

export async function getUnreadCountHandler(req: Request, res: Response) {
  res.json({ count: await notificationsService.getUnreadCount(req.userId as string) });
}

export async function markReadHandler(req: Request, res: Response) {
  await notificationsService.markRead(req.userId as string, req.params.id as string);
  res.status(204).send();
}

export async function markAllReadHandler(req: Request, res: Response) {
  await notificationsService.markAllRead(req.userId as string);
  res.status(204).send();
}
