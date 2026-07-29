import type { Request, Response } from 'express';
import type { AuthResponseDto } from '@forms-assistant/shared';
import * as authService from './auth.service';
import { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } from './refresh-cookie';
import { UnauthorizedError } from '../../lib/errors';

export async function registerHandler(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken } satisfies AuthResponseDto);
}

export async function loginHandler(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken } satisfies AuthResponseDto);
}

export async function refreshHandler(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw new UnauthorizedError('Refresh-токен отсутствует');
  }

  const { user, accessToken, refreshToken } = await authService.refresh(token);
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken } satisfies AuthResponseDto);
}

export function logoutHandler(_req: Request, res: Response) {
  clearRefreshCookie(res);
  res.status(204).send();
}
