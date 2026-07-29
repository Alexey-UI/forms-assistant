import { createHmac, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { env } from '../config/env';

const COOKIE_NAME = 'anon_token';
const COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

// Токен идентифицирует только браузер (для защиты от повторного анонимного прохождения),
// не пользователя — используется исключительно для хэша в AnonymousSubmissionGuard.
export function getOrCreateAnonymousToken(req: Request, res: Response): string {
  const existing = req.cookies?.[COOKIE_NAME];
  if (typeof existing === 'string' && existing.length > 0) {
    return existing;
  }
  const token = randomBytes(24).toString('hex');
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  });
  return token;
}

export function hashAnonymousToken(surveyId: string, token: string): string {
  return createHmac('sha256', env.ANONYMOUS_TOKEN_SECRET)
    .update(`${surveyId}:${token}`)
    .digest('hex');
}
