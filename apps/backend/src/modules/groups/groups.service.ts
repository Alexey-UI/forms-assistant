import type { CreateGroupInput, UpdateGroupInput } from '@forms-assistant/shared';
import { prisma } from '../../lib/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors';
import { toGroupDetailDto, toGroupDto } from './groups.mapper';
import { countUnreadMessages } from './chat.service';

const MEMBERS_INCLUDE = { members: { include: { user: true } } } as const;

async function unreadCountFromGroup(
  group: { id: string; members: { userId: string; lastReadAt: Date }[] },
  userId: string,
): Promise<number> {
  const membership = group.members.find((member) => member.userId === userId);
  if (!membership) {
    return 0;
  }
  return countUnreadMessages(group.id, userId, membership.lastReadAt);
}

export async function getMembershipOrThrow(groupId: string, userId: string) {
  const membership = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) {
    throw new ForbiddenError('Вы не состоите в этой группе');
  }
  return membership;
}

export async function assertGroupAdmin(groupId: string, userId: string) {
  const membership = await getMembershipOrThrow(groupId, userId);
  if (membership.role !== 'ADMIN') {
    throw new ForbiddenError('Требуются права администратора группы');
  }
}

export async function createGroup(userId: string, input: CreateGroupInput) {
  const group = await prisma.group.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      createdById: userId,
      members: { create: [{ userId, role: 'ADMIN' }] },
    },
    include: MEMBERS_INCLUDE,
  });
  return toGroupDetailDto(group, userId);
}

export async function listMyGroups(userId: string) {
  const groups = await prisma.group.findMany({
    where: { members: { some: { userId } } },
    include: MEMBERS_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return Promise.all(
    groups.map(async (group) =>
      toGroupDto(group, userId, await unreadCountFromGroup(group, userId)),
    ),
  );
}

export async function getGroupDetail(groupId: string, userId: string) {
  await getMembershipOrThrow(groupId, userId);
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: MEMBERS_INCLUDE });
  if (!group) {
    throw new NotFoundError('Группа не найдена');
  }
  return toGroupDetailDto(group, userId, await unreadCountFromGroup(group, userId));
}

export async function updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
  await assertGroupAdmin(groupId, userId);
  const group = await prisma.group.update({
    where: { id: groupId },
    data: { name: input.name, description: input.description },
    include: MEMBERS_INCLUDE,
  });
  return toGroupDetailDto(group, userId, await unreadCountFromGroup(group, userId));
}

export async function deleteGroup(groupId: string, userId: string) {
  await assertGroupAdmin(groupId, userId);
  await prisma.group.delete({ where: { id: groupId } });
}

export async function addMember(groupId: string, requesterId: string, newUserId: string) {
  await assertGroupAdmin(groupId, requesterId);

  const targetUser = await prisma.user.findUnique({ where: { id: newUserId } });
  if (!targetUser) {
    throw new NotFoundError('Пользователь не найден');
  }

  const existing = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: newUserId } },
  });
  if (existing) {
    throw new ConflictError('Пользователь уже состоит в группе');
  }

  await prisma.groupMembership.create({ data: { groupId, userId: newUserId, role: 'MEMBER' } });
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    include: MEMBERS_INCLUDE,
  });
  return toGroupDetailDto(group, requesterId, await unreadCountFromGroup(group, requesterId));
}

async function assertNotRemovingLastAdmin(groupId: string, targetUserId: string) {
  const target = await prisma.groupMembership.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
  if (!target || target.role !== 'ADMIN') {
    return;
  }
  const adminCount = await prisma.groupMembership.count({ where: { groupId, role: 'ADMIN' } });
  if (adminCount <= 1) {
    throw new ConflictError('В группе должен остаться хотя бы один администратор');
  }
}

export async function removeMember(groupId: string, requesterId: string, targetUserId: string) {
  const isSelf = requesterId === targetUserId;
  if (!isSelf) {
    await assertGroupAdmin(groupId, requesterId);
  } else {
    await getMembershipOrThrow(groupId, requesterId);
  }

  await assertNotRemovingLastAdmin(groupId, targetUserId);

  await prisma.groupMembership.delete({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
}

export async function updateMemberRole(
  groupId: string,
  requesterId: string,
  targetUserId: string,
  role: 'ADMIN' | 'MEMBER',
) {
  await assertGroupAdmin(groupId, requesterId);
  if (role === 'MEMBER') {
    await assertNotRemovingLastAdmin(groupId, targetUserId);
  }
  await prisma.groupMembership.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role },
  });
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    include: MEMBERS_INCLUDE,
  });
  return toGroupDetailDto(group, requesterId, await unreadCountFromGroup(group, requesterId));
}
