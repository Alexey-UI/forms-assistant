import { prisma } from '../../lib/prisma';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import { toFriendRequestDto } from './friends.mapper';
import { toUserDto } from '../users/user.mapper';
import { notify } from '../notifications/notifications.service';

const USERS_INCLUDE = { fromUser: true, toUser: true } as const;

export async function sendFriendRequest(fromUserId: string, targetUserId: string) {
  if (fromUserId === targetUserId) {
    throw new BadRequestError('Нельзя отправить заявку самому себе');
  }

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    throw new NotFoundError('Пользователь не найден');
  }

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { fromUserId, toUserId: targetUserId },
        { fromUserId: targetUserId, toUserId: fromUserId },
      ],
    },
  });

  if (existing) {
    if (existing.status === 'ACCEPTED') {
      throw new ConflictError('Вы уже друзья');
    }
    if (existing.status === 'PENDING') {
      if (existing.fromUserId === fromUserId) {
        throw new ConflictError('Заявка уже отправлена');
      }
      // Встречная заявка уже ждёт ответа — считаем это взаимным подтверждением.
      const updated = await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { status: 'ACCEPTED' },
        include: USERS_INCLUDE,
      });
      return toFriendRequestDto(updated);
    }
    // DECLINED ранее — разрешаем отправить заявку заново.
    const updated = await prisma.friendRequest.update({
      where: { id: existing.id },
      data: { fromUserId, toUserId: targetUserId, status: 'PENDING' },
      include: USERS_INCLUDE,
    });
    await notify(
      targetUserId,
      'FRIEND_REQUEST',
      `${updated.fromUser.displayName} отправил(а) вам заявку в друзья`,
      '/profile',
    );
    return toFriendRequestDto(updated);
  }

  const created = await prisma.friendRequest.create({
    data: { fromUserId, toUserId: targetUserId, status: 'PENDING' },
    include: USERS_INCLUDE,
  });
  await notify(
    targetUserId,
    'FRIEND_REQUEST',
    `${created.fromUser.displayName} отправил(а) вам заявку в друзья`,
    '/profile',
  );
  return toFriendRequestDto(created);
}

export async function respondToFriendRequest(
  requestId: string,
  userId: string,
  action: 'ACCEPT' | 'DECLINE',
) {
  const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    throw new NotFoundError('Заявка не найдена');
  }
  if (request.toUserId !== userId) {
    throw new ForbiddenError('Вы не можете ответить на эту заявку');
  }
  if (request.status !== 'PENDING') {
    throw new ConflictError('Заявка уже обработана');
  }

  const updated = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED' },
    include: USERS_INCLUDE,
  });
  return toFriendRequestDto(updated);
}

export async function listIncomingRequests(userId: string) {
  const requests = await prisma.friendRequest.findMany({
    where: { toUserId: userId, status: 'PENDING' },
    include: USERS_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return requests.map(toFriendRequestDto);
}

export async function listOutgoingRequests(userId: string) {
  const requests = await prisma.friendRequest.findMany({
    where: { fromUserId: userId, status: 'PENDING' },
    include: USERS_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return requests.map(toFriendRequestDto);
}

export async function listFriends(userId: string) {
  const requests = await prisma.friendRequest.findMany({
    where: { status: 'ACCEPTED', OR: [{ fromUserId: userId }, { toUserId: userId }] },
    include: USERS_INCLUDE,
    orderBy: { updatedAt: 'desc' },
  });
  return requests.map((request) =>
    toUserDto(request.fromUserId === userId ? request.toUser : request.fromUser),
  );
}

export async function removeFriend(userId: string, friendUserId: string) {
  const request = await prisma.friendRequest.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { fromUserId: userId, toUserId: friendUserId },
        { fromUserId: friendUserId, toUserId: userId },
      ],
    },
  });
  if (!request) {
    throw new NotFoundError('Дружба не найдена');
  }
  await prisma.friendRequest.delete({ where: { id: request.id } });
}
