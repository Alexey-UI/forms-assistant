import { z } from 'zod';

export const sendGroupMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Сообщение не может быть пустым')
    .max(2000, 'Максимум 2000 символов'),
});
export type SendGroupMessageInput = z.infer<typeof sendGroupMessageSchema>;

export const editGroupMessageSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Сообщение не может быть пустым')
    .max(2000, 'Максимум 2000 символов'),
});
export type EditGroupMessageInput = z.infer<typeof editGroupMessageSchema>;

export const listGroupMessagesQuerySchema = z.object({
  before: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ListGroupMessagesQuery = z.infer<typeof listGroupMessagesQuerySchema>;

export const setMemberWriteAccessSchema = z.object({
  canWrite: z.boolean(),
});
export type SetMemberWriteAccessInput = z.infer<typeof setMemberWriteAccessSchema>;
