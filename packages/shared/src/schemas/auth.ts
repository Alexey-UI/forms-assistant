import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов').max(72, 'Максимум 72 символа'),
  displayName: z.string().trim().min(2, 'Минимум 2 символа').max(60, 'Максимум 60 символов'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
