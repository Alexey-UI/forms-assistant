import type { Request, Response } from 'express';
import { getOrCreateAnonymousToken } from '../../lib/anonymous-token';
import { getPublishedSurveyByToken, getPublishedSurveyForUser } from './responses.access';
import * as responsesService from './responses.service';

function resolveAnonymousToken(
  req: Request,
  res: Response,
  anonymityMode: string,
): string | undefined {
  if (anonymityMode !== 'ANONYMOUS') {
    return undefined;
  }
  return getOrCreateAnonymousToken(req, res);
}

export async function getSurveyByTokenHandler(req: Request, res: Response) {
  const survey = await getPublishedSurveyByToken(req.params.token as string);
  const anonymousToken = resolveAnonymousToken(req, res, survey.anonymityMode);
  const dto = await responsesService.buildSurveyForTaking(survey, {
    userId: req.userId,
    anonymousToken,
  });
  res.json(dto);
}

export async function submitByTokenHandler(req: Request, res: Response) {
  const survey = await getPublishedSurveyByToken(req.params.token as string);
  const anonymousToken = resolveAnonymousToken(req, res, survey.anonymityMode);
  await responsesService.submitResponse(survey, req.body, { userId: req.userId, anonymousToken });
  res.status(201).json({ status: 'ok' });
}

export async function getSurveyByIdHandler(req: Request, res: Response) {
  const survey = await getPublishedSurveyForUser(req.params.id as string, req.userId as string);
  const anonymousToken = resolveAnonymousToken(req, res, survey.anonymityMode);
  const dto = await responsesService.buildSurveyForTaking(survey, {
    userId: req.userId,
    anonymousToken,
  });
  res.json(dto);
}

export async function submitByIdHandler(req: Request, res: Response) {
  const survey = await getPublishedSurveyForUser(req.params.id as string, req.userId as string);
  const anonymousToken = resolveAnonymousToken(req, res, survey.anonymityMode);
  await responsesService.submitResponse(survey, req.body, { userId: req.userId, anonymousToken });
  res.status(201).json({ status: 'ok' });
}

export async function getResultsHandler(req: Request, res: Response) {
  res.json(await responsesService.getResults(req.params.id as string, req.userId as string));
}

export async function getParticipantsHandler(req: Request, res: Response) {
  res.json(await responsesService.getParticipants(req.params.id as string, req.userId as string));
}
