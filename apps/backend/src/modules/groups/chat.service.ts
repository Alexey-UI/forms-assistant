import type {
  EditGroupMessageInput,
  GroupUnreadSummaryDto,
  ListGroupMessagesQuery,
  SendGroupMessageInput,
} from '@forms-assistant/shared';
import { prisma } from '../../lib/prisma';
import { ForbiddenError, NotFoundError } from '../../lib/errors';
import { assertGroupAdmin, getMembershipOrThrow } from './groups.service';
import { toGroupMessageDto } from './chat.mapper';

const DEFAULT_PAGE_SIZE = 50;
const MESSAGES_INCLUDE = { author: true } as const;

export async function listMessages(groupId: string, userId: string, query: ListGroupMessagesQuery) {
  await getMembershipOrThrow(groupId, userId);
  const limit = query.limit ?? DEFAULT_PAGE_SIZE;

  const messages = await prisma.groupMessage.findMany({
    where: { groupId },
    include: MESSAGES_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: limit,
    ...(query.before ? { cursor: { id: query.before }, skip: 1 } : {}),
  });

  const nextCursor = messages.length === limit ? (messages[messages.length - 1]?.id ?? null) : null;

  return {
    messages: messages.map(toGroupMessageDto).reverse(),
    nextCursor,
  };
}

export async function sendMessage(groupId: string, userId: string, input: SendGroupMessageInput) {
  const membership = await getMembershipOrThrow(groupId, userId);
  if (!membership.canWrite) {
    throw new ForbiddenError('Вам запрещено писать в этой группе');
  }

  const message = await prisma.groupMessage.create({
    data: { groupId, authorId: userId, text: input.text },
    include: MESSAGES_INCLUDE,
  });

  await prisma.groupMembership.update({
    where: { groupId_userId: { groupId, userId } },
    data: { lastReadAt: message.createdAt },
  });

  return toGroupMessageDto(message);
}

async function getOwnedMessageOrThrow(groupId: string, messageId: string) {
  const message = await prisma.groupMessage.findUnique({ where: { id: messageId } });
  if (!message || message.groupId !== groupId) {
    throw new NotFoundError('Сообщение не найдено');
  }
  return message;
}

export async function editMessage(
  groupId: string,
  userId: string,
  messageId: string,
  input: EditGroupMessageInput,
) {
  await getMembershipOrThrow(groupId, userId);
  const message = await getOwnedMessageOrThrow(groupId, messageId);
  if (message.authorId !== userId) {
    throw new ForbiddenError('Можно редактировать только свои сообщения');
  }

  const updated = await prisma.groupMessage.update({
    where: { id: messageId },
    data: { text: input.text, editedAt: new Date() },
    include: MESSAGES_INCLUDE,
  });
  return toGroupMessageDto(updated);
}

export async function deleteMessage(groupId: string, userId: string, messageId: string) {
  const membership = await getMembershipOrThrow(groupId, userId);
  const message = await getOwnedMessageOrThrow(groupId, messageId);
  if (message.authorId !== userId && membership.role !== 'ADMIN') {
    throw new ForbiddenError('Недостаточно прав для удаления этого сообщения');
  }

  await prisma.groupMessage.delete({ where: { id: messageId } });
}

export async function markRead(groupId: string, userId: string) {
  await getMembershipOrThrow(groupId, userId);
  await prisma.groupMembership.update({
    where: { groupId_userId: { groupId, userId } },
    data: { lastReadAt: new Date() },
  });
}

export async function countUnreadMessages(
  groupId: string,
  userId: string,
  since: Date,
): Promise<number> {
  return prisma.groupMessage.count({
    where: { groupId, authorId: { not: userId }, createdAt: { gt: since } },
  });
}

export async function getUnreadSummary(userId: string): Promise<GroupUnreadSummaryDto[]> {
  const memberships = await prisma.groupMembership.findMany({ where: { userId } });
  return Promise.all(
    memberships.map(async (membership) => ({
      groupId: membership.groupId,
      unreadCount: await countUnreadMessages(membership.groupId, userId, membership.lastReadAt),
    })),
  );
}

export async function setMemberWriteAccess(
  groupId: string,
  requesterId: string,
  targetUserId: string,
  canWrite: boolean,
) {
  await assertGroupAdmin(groupId, requesterId);
  const target = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!target) {
    throw new NotFoundError('Участник не найден');
  }
  await prisma.groupMembership.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { canWrite },
  });
}
