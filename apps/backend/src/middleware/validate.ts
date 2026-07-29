import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { BadRequestError } from '../lib/errors';

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new BadRequestError('Ошибка валидации', result.error.flatten()));
      return;
    }
    req.body = result.data as z.infer<T>;
    next();
  };
}

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new BadRequestError('Ошибка валидации параметров запроса', result.error.flatten()));
      return;
    }
    req.query = result.data as never;
    next();
  };
}

export function validateParams<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(new BadRequestError('Ошибка валидации параметров маршрута', result.error.flatten()));
      return;
    }
    req.params = result.data as never;
    next();
  };
}
