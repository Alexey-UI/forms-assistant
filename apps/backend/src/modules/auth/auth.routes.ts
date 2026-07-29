import { Router } from 'express';
import { loginSchema, registerSchema } from '@forms-assistant/shared';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/async-handler';
import { loginHandler, logoutHandler, refreshHandler, registerHandler } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(registerHandler));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.post('/refresh', asyncHandler(refreshHandler));
authRouter.post('/logout', logoutHandler);
