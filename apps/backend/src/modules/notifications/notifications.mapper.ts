import type { Notification } from '@prisma/client';
import type { NotificationDto } from '@forms-assistant/shared';

export function toNotificationDto(notification: Notification): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    link: notification.link,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}
