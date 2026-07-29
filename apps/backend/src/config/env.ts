import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL обязателен'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET должен быть не короче 16 символов'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET должен быть не короче 16 символов'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  ANONYMOUS_TOKEN_SECRET: z
    .string()
    .min(16, 'ANONYMOUS_TOKEN_SECRET должен быть не короче 16 символов'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Некорректная конфигурация окружения:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
