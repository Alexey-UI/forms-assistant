import type { GroupMessage, User } from '@prisma/client';
import type { GroupMessageDto } from '@forms-assistant/shared';
import { toUserDto } from '../users/user.mapper';

type MessageWithAuthor = GroupMessage & { author: User };

export function toGroupMessageDto(message: MessageWithAuthor): GroupMessageDto {
  return {
    id: message.id,
    groupId: message.groupId,
    author: toUserDto(message.author),
    text: message.text,
    editedAt: message.editedAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
  };
}
