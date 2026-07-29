import type { Survey } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ForbiddenError, NotFoundError } from '../../lib/errors';

export async function getPublishedSurveyByToken(token: string): Promise<Survey> {
  const link = await prisma.surveyShareLink.findUnique({ where: { token } });
  if (!link) {
    throw new NotFoundError('Ссылка на опрос недействительна');
  }
  const survey = await prisma.survey.findUnique({ where: { id: link.surveyId } });
  if (!survey || survey.status !== 'PUBLISHED') {
    throw new NotFoundError('Опрос недоступен');
  }
  return survey;
}

export async function getPublishedSurveyForUser(surveyId: string, userId: string): Promise<Survey> {
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
  if (!survey || survey.status !== 'PUBLISHED') {
    throw new NotFoundError('Опрос недоступен');
  }
  if (survey.authorId === userId) {
    return survey;
  }

  const invited = await prisma.surveyInvite.findUnique({
    where: { surveyId_userId: { surveyId, userId } },
  });
  if (invited) {
    return survey;
  }

  const sharedGroupMembership = await prisma.surveyGroupShare.findFirst({
    where: { surveyId, group: { members: { some: { userId } } } },
  });
  if (sharedGroupMembership) {
    return survey;
  }

  throw new ForbiddenError('У вас нет доступа к этому опросу');
}
