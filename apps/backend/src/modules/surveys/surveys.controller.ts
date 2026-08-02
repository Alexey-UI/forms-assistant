import type { Request, Response } from 'express';
import * as surveysService from './surveys.service';

export async function createSurveyHandler(req: Request, res: Response) {
  const survey = await surveysService.createSurvey(req.userId as string, req.body);
  res.status(201).json(survey);
}

export async function listMySurveysHandler(req: Request, res: Response) {
  res.json(await surveysService.listMySurveys(req.userId as string));
}

export async function listSharedWithMeHandler(req: Request, res: Response) {
  res.json(await surveysService.listSharedWithMe(req.userId as string));
}

export async function getSurveyHandler(req: Request, res: Response) {
  res.json(await surveysService.getSurveyForAuthor(req.params.id as string, req.userId as string));
}

export async function updateSurveyHandler(req: Request, res: Response) {
  res.json(
    await surveysService.updateSurvey(req.params.id as string, req.userId as string, req.body),
  );
}

export async function deleteSurveyHandler(req: Request, res: Response) {
  await surveysService.deleteSurvey(req.params.id as string, req.userId as string);
  res.status(204).send();
}

export async function publishSurveyHandler(req: Request, res: Response) {
  res.json(await surveysService.publishSurvey(req.params.id as string, req.userId as string));
}

export async function closeSurveyHandler(req: Request, res: Response) {
  res.json(await surveysService.closeSurvey(req.params.id as string, req.userId as string));
}

export async function createShareLinkHandler(req: Request, res: Response) {
  const token = await surveysService.createShareLink(req.params.id as string, req.userId as string);
  res.status(201).json({ token });
}

export async function revokeShareLinkHandler(req: Request, res: Response) {
  await surveysService.revokeShareLink(req.params.id as string, req.userId as string);
  res.status(204).send();
}

export async function inviteUsersHandler(req: Request, res: Response) {
  await surveysService.inviteUsers(req.params.id as string, req.userId as string, req.body.userIds);
  res.status(204).send();
}

export async function shareWithGroupHandler(req: Request, res: Response) {
  await surveysService.shareWithGroup(
    req.params.id as string,
    req.userId as string,
    req.body.groupId,
  );
  res.status(204).send();
}

export async function remindNonRespondentsHandler(req: Request, res: Response) {
  const remindedCount = await surveysService.remindNonRespondents(
    req.params.id as string,
    req.userId as string,
  );
  res.json({ remindedCount });
}
