import { Router } from 'express';
import { submitResponseSchema } from '@forms-assistant/shared';
import { optionalAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/async-handler';
import { getSurveyByTokenHandler, submitByTokenHandler } from './responses.controller';

export const publicSurveyRouter = Router();

publicSurveyRouter.use(optionalAuth);

publicSurveyRouter.get('/:token', asyncHandler(getSurveyByTokenHandler));
publicSurveyRouter.post(
  '/:token/responses',
  validateBody(submitResponseSchema),
  asyncHandler(submitByTokenHandler),
);
