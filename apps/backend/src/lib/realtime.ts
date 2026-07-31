import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { verifyAccessToken } from './jwt';
import { prisma } from './prisma';
import { logger } from './logger';
import { env } from '../config/env';

let io: SocketIOServer | null = null;

const userRoom = (userId: string) => `user:${userId}`;
const groupRoom = (groupId: string) => `group:${groupId}`;

export function initRealtime(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('unauthorized'));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    void socket.join(userRoom(userId));

    void prisma.groupMembership
      .findMany({ where: { userId }, select: { groupId: true } })
      .then((memberships) => {
        for (const membership of memberships) {
          void socket.join(groupRoom(membership.groupId));
        }
      })
      .catch((error: unknown) => {
        logger.error({ error }, 'Failed to join group rooms on socket connect');
      });
  });

  return io;
}

export function emitToGroup(groupId: string, event: string, payload: unknown): void {
  io?.to(groupRoom(groupId)).emit(event, payload);
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(userRoom(userId)).emit(event, payload);
}

export async function joinUserToGroup(userId: string, groupId: string): Promise<void> {
  await io?.in(userRoom(userId)).socketsJoin(groupRoom(groupId));
}

export async function removeUserFromGroup(userId: string, groupId: string): Promise<void> {
  await io?.in(userRoom(userId)).socketsLeave(groupRoom(groupId));
}
