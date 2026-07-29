import type { Request, Response } from 'express';
import { BadRequestError } from '../../lib/errors';
import * as friendsService from './friends.service';

export async function sendFriendRequestHandler(req: Request, res: Response) {
  const result = await friendsService.sendFriendRequest(
    req.userId as string,
    req.body.targetUserId,
  );
  res.status(201).json(result);
}

export async function respondFriendRequestHandler(req: Request, res: Response) {
  const result = await friendsService.respondToFriendRequest(
    req.params.id as string,
    req.userId as string,
    req.body.action,
  );
  res.json(result);
}

export async function listFriendRequestsHandler(req: Request, res: Response) {
  const direction = req.query.direction;
  if (direction === 'outgoing') {
    res.json(await friendsService.listOutgoingRequests(req.userId as string));
    return;
  }
  if (direction === 'incoming' || direction === undefined) {
    res.json(await friendsService.listIncomingRequests(req.userId as string));
    return;
  }
  throw new BadRequestError('Некорректное значение direction');
}

export async function listFriendsHandler(req: Request, res: Response) {
  res.json(await friendsService.listFriends(req.userId as string));
}

export async function removeFriendHandler(req: Request, res: Response) {
  await friendsService.removeFriend(req.userId as string, req.params.userId as string);
  res.status(204).send();
}
