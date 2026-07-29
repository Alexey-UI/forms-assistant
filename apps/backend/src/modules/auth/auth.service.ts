import type { LoginInput, RegisterInput } from '@forms-assistant/shared';
import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { ConflictError, UnauthorizedError } from '../../lib/errors';
import { toUserDto } from '../users/user.mapper';

interface AuthResult {
  user: ReturnType<typeof toUserDto>;
  accessToken: string;
  refreshToken: string;
}

async function issueTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
  return {
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
  };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError('Пользователь с таким email уже зарегистрирован');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, displayName: input.displayName },
  });

  const tokens = await issueTokens(user.id);
  return { user: toUserDto(user), ...tokens };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError('Неверный email или пароль');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Неверный email или пароль');
  }

  const tokens = await issueTokens(user.id);
  return { user: toUserDto(user), ...tokens };
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  let userId: string;
  try {
    userId = verifyRefreshToken(refreshToken).sub;
  } catch {
    throw new UnauthorizedError('Refresh-токен недействителен или истёк');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UnauthorizedError('Пользователь не найден');
  }

  const tokens = await issueTokens(user.id);
  return { user: toUserDto(user), ...tokens };
}
