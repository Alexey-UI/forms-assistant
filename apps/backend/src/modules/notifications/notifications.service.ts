import type { NotificationType } from '@forms-assistant/shared';
import { prisma } from '../../lib/prisma';
import { emitToUser } from '../../lib/realtime';
import { toNotificationDto } from './notifications.mapper';

const LIST_LIMIT = 50;

export async function notify(
  userId: string,
  type: NotificationType,
  message: string,
  link?: string,
): Promise<void> {
  const notification = await prisma.notification.create({
    data: { userId, type, message, link: link ?? null },
  });
  emitToUser(userId, 'notification:new', toNotificationDto(notification));
}

export async function listNotifications(userId: string) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: LIST_LIMIT,
  });
  return notifications.map(toNotificationDto);
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
