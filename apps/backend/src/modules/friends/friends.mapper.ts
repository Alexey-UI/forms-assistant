import type { FriendRequest, User } from '@prisma/client';
import type { FriendRequestDto } from '@forms-assistant/shared';
import { toUserDto } from '../users/user.mapper';

type FriendRequestWithUsers = FriendRequest & { fromUser: User; toUser: User };

export function toFriendRequestDto(request: FriendRequestWithUsers): FriendRequestDto {
  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    fromUser: toUserDto(request.fromUser),
    toUser: toUserDto(request.toUser),
  };
}
