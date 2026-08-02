import { Router } from 'express';
import {
  createSurveySchema,
  inviteToSurveySchema,
  shareSurveyWithGroupSchema,
  submitResponseSchema,
  updateSurveySchema,
} from '@forms-assistant/shared';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { asyncHandler } from '../../middleware/async-handler';
import {
  closeSurveyHandler,
  createShareLinkHandler,
  createSurveyHandler,
  deleteSurveyHandler,
  getSurveyHandler,
  inviteUsersHandler,
  listMySurveysHandler,
  listSharedWithMeHandler,
  publishSurveyHandler,
  remindNonRespondentsHandler,
  revokeShareLinkHandler,
  shareWithGroupHandler,
  updateSurveyHandler,
} from './surveys.controller';
import {
  exportResultsHandler,
  getParticipantsHandler,
  getResultsHandler,
  getSurveyByIdHandler,
  submitByIdHandler,
} from '../responses/responses.controller';

export const surveysRouter = Router();

surveysRouter.use(requireAuth);

surveysRouter.get('/mine', asyncHandler(listMySurveysHandler));
surveysRouter.get('/shared-with-me', asyncHandler(listSharedWithMeHandler));
surveysRouter.post('/', validateBody(createSurveySchema), asyncHandler(createSurveyHandler));
surveysRouter.get('/:id', asyncHandler(getSurveyHandler));
surveysRouter.patch('/:id', validateBody(updateSurveySchema), asyncHandler(updateSurveyHandler));
surveysRouter.delete('/:id', asyncHandler(deleteSurveyHandler));
surveysRouter.post('/:id/publish', asyncHandler(publishSurveyHandler));
surveysRouter.post('/:id/close', asyncHandler(closeSurveyHandler));
surveysRouter.post('/:id/share-link', asyncHandler(createShareLinkHandler));
surveysRouter.delete('/:id/share-link', asyncHandler(revokeShareLinkHandler));
surveysRouter.post(
  '/:id/invite',
  validateBody(inviteToSurveySchema),
  asyncHandler(inviteUsersHandler),
);
surveysRouter.post(
  '/:id/share-group',
  validateBody(shareSurveyWithGroupSchema),
  asyncHandler(shareWithGroupHandler),
);
surveysRouter.get('/:id/take', asyncHandler(getSurveyByIdHandler));
surveysRouter.post(
  '/:id/responses',
  validateBody(submitResponseSchema),
  asyncHandler(submitByIdHandler),
);
surveysRouter.get('/:id/results', asyncHandler(getResultsHandler));
surveysRouter.get('/:id/results/export', asyncHandler(exportResultsHandler));
surveysRouter.get('/:id/participants', asyncHandler(getParticipantsHandler));
surveysRouter.post('/:id/remind', asyncHandler(remindNonRespondentsHandler));
