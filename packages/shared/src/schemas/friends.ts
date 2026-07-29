import { z } from 'zod';

export const sendFriendRequestSchema = z.object({
  targetUserId: z.string().uuid('Некорректный идентификатор пользователя'),
});
export type SendFriendRequestInput = z.infer<typeof sendFriendRequestSchema>;

export const respondFriendRequestSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
});
export type RespondFriendRequestInput = z.infer<typeof respondFriendRequestSchema>;
