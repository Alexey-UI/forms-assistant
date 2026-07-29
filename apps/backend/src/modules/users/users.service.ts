import type { UpdateProfileInput } from '@forms-assistant/shared';
import { prisma } from '../../lib/prisma';
import { NotFoundError } from '../../lib/errors';
import { toUserDto } from './user.mapper';

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError('Пользователь не найден');
  }
  return toUserDto(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.update({ where: { id: userId }, data: input });
  return toUserDto(user);
}

export async function searchUsers(query: string, excludeUserId: string) {
  const users = await prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
    orderBy: { displayName: 'asc' },
  });
  return users.map(toUserDto);
}
