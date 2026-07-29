import type { Group, GroupMembership, User } from '@prisma/client';
import type { GroupDetailDto, GroupDto, GroupMemberDto } from '@forms-assistant/shared';
import { toUserDto } from '../users/user.mapper';

type MembershipWithUser = GroupMembership & { user: User };
type GroupWithMembers = Group & { members: MembershipWithUser[] };

export function toGroupDto(group: GroupWithMembers, viewerUserId: string): GroupDto {
  const myMembership = group.members.find((member) => member.userId === viewerUserId);
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    createdAt: group.createdAt.toISOString(),
    memberCount: group.members.length,
    myRole: myMembership?.role ?? null,
  };
}

export function toGroupDetailDto(group: GroupWithMembers, viewerUserId: string): GroupDetailDto {
  return {
    ...toGroupDto(group, viewerUserId),
    members: group.members
      .slice()
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
      .map(toGroupMemberDto),
  };
}

function toGroupMemberDto(member: MembershipWithUser): GroupMemberDto {
  return {
    user: toUserDto(member.user),
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  };
}
