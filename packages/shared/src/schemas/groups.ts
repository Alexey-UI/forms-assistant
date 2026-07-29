import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, 'Минимум 2 символа').max(80, 'Максимум 80 символов'),
  description: z.string().trim().max(500, 'Максимум 500 символов').optional(),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const addGroupMemberSchema = z.object({
  userId: z.string().uuid('Некорректный идентификатор пользователя'),
});
export type AddGroupMemberInput = z.infer<typeof addGroupMemberSchema>;

export const updateGroupMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});
export type UpdateGroupMemberRoleInput = z.infer<typeof updateGroupMemberRoleSchema>;
