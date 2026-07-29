import type { Request, Response } from 'express';
import { BadRequestError } from '../../lib/errors';
import * as usersService from './users.service';

export async function getMeHandler(req: Request, res: Response) {
  const user = await usersService.getUserById(req.userId as string);
  res.json(user);
}

export async function updateMeHandler(req: Request, res: Response) {
  const user = await usersService.updateProfile(req.userId as string, req.body);
  res.json(user);
}

export async function getUserHandler(req: Request, res: Response) {
  const user = await usersService.getUserById(req.params.id as string);
  res.json(user);
}

export async function searchUsersHandler(req: Request, res: Response) {
  const query = req.query.q;
  if (typeof query !== 'string' || query.trim().length < 2) {
    throw new BadRequestError('Параметр q обязателен и должен содержать минимум 2 символа');
  }
  const users = await usersService.searchUsers(query.trim(), req.userId as string);
  res.json(users);
}
