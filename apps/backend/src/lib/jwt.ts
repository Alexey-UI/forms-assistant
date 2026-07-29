import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

export function signAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'access' } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_TTL,
    } as jwt.SignOptions,
  );
}

export function signRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_TTL,
    } as jwt.SignOptions,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}
