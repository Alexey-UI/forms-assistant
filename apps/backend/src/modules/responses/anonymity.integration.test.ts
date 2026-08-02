import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import { prisma } from '../../lib/prisma';

const app = createApp();

async function registerUser(displayName: string) {
  const email = `${randomUUID()}@example.com`;
  const response = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', displayName });
  return {
    accessToken: response.body.accessToken as string,
    userId: response.body.user.id as string,
  };
}

async function createPublishedSurvey(accessToken: string, anonymityMode: string) {
  const created = await request(app)
    .post('/api/surveys')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      title: 'Anonymity test survey',
      anonymityMode,
      allowMultipleSubmissions: false,
      questions: [
        {
          type: 'TEXT',
          text: 'Что скажете?',
          required: false,
          order: 0,
        },
      ],
    });
  const surveyId = created.body.id as string;
  await request(app)
    .post(`/api/surveys/${surveyId}/publish`)
    .set('Authorization', `Bearer ${accessToken}`);
  const linkResponse = await request(app)
    .post(`/api/surveys/${surveyId}/share-link`)
    .set('Authorization', `Bearer ${accessToken}`);
  return { surveyId, token: linkResponse.body.token as string };
}

describe('survey anonymity guarantees', () => {
  let authorToken: string;

  beforeAll(async () => {
    const author = await registerUser('Anonymity Author');
    authorToken = author.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('never links a Response to a user for ANONYMOUS surveys, and tracks no Participation', async () => {
    const { surveyId, token } = await createPublishedSurvey(authorToken, 'ANONYMOUS');
    const respondent = await registerUser('Anonymous Respondent');

    const submission = await request(app)
      .post(`/api/s/${token}/responses`)
      .set('Authorization', `Bearer ${respondent.accessToken}`)
      .send({
        answers: [{ questionId: await getFirstQuestionId(surveyId), textValue: 'Всё супер' }],
      });

    expect(submission.status).toBe(201);

    const responses = await prisma.response.findMany({ where: { surveyId } });
    expect(responses).toHaveLength(1);
    expect(responses[0]?.respondentUserId).toBeNull();

    const participationCount = await prisma.participation.count({ where: { surveyId } });
    expect(participationCount).toBe(0);
  });

  it('creates a Participation row but keeps Response.respondentUserId null for PUBLIC_LIST surveys', async () => {
    const { surveyId, token } = await createPublishedSurvey(authorToken, 'PUBLIC_LIST');
    const respondent = await registerUser('Public List Respondent');

    const submission = await request(app)
      .post(`/api/s/${token}/responses`)
      .set('Authorization', `Bearer ${respondent.accessToken}`)
      .send({
        answers: [{ questionId: await getFirstQuestionId(surveyId), textValue: 'Нормально' }],
      });

    expect(submission.status).toBe(201);

    const response = await prisma.response.findFirst({ where: { surveyId } });
    expect(response?.respondentUserId).toBeNull();

    const participation = await prisma.participation.findUnique({
      where: { surveyId_userId: { surveyId, userId: respondent.userId } },
    });
    expect(participation).not.toBeNull();
  });

  it('links Response.respondentUserId to the author for NAMED surveys', async () => {
    const { surveyId, token } = await createPublishedSurvey(authorToken, 'NAMED');
    const respondent = await registerUser('Named Respondent');

    const submission = await request(app)
      .post(`/api/s/${token}/responses`)
      .set('Authorization', `Bearer ${respondent.accessToken}`)
      .send({
        answers: [{ questionId: await getFirstQuestionId(surveyId), textValue: 'Отлично' }],
      });

    expect(submission.status).toBe(201);

    const response = await prisma.response.findFirst({ where: { surveyId } });
    expect(response?.respondentUserId).toBe(respondent.userId);
  });

  it('rejects an unauthenticated submission to a NAMED survey', async () => {
    const { surveyId, token } = await createPublishedSurvey(authorToken, 'NAMED');

    const submission = await request(app)
      .post(`/api/s/${token}/responses`)
      .send({ answers: [{ questionId: await getFirstQuestionId(surveyId), textValue: 'Тест' }] });

    expect(submission.status).toBe(401);
  });

  it('never includes respondent identity in CSV export for ANONYMOUS surveys', async () => {
    const { surveyId, token } = await createPublishedSurvey(authorToken, 'ANONYMOUS');
    const respondent = await registerUser('CSV Anonymous Respondent');

    await request(app)
      .post(`/api/s/${token}/responses`)
      .set('Authorization', `Bearer ${respondent.accessToken}`)
      .send({
        answers: [{ questionId: await getFirstQuestionId(surveyId), textValue: 'Секретный ответ' }],
      });

    const exported = await request(app)
      .get(`/api/surveys/${surveyId}/results/export`)
      .set('Authorization', `Bearer ${authorToken}`);

    expect(exported.status).toBe(200);
    expect(exported.text).not.toContain('Респондент');
    expect(exported.text).not.toContain(respondent.userId);
  });

  it('never includes respondent identity in CSV export for PUBLIC_LIST surveys', async () => {
    const { surveyId, token } = await createPublishedSurvey(authorToken, 'PUBLIC_LIST');
    const respondent = await registerUser('CSV Public Respondent');

    await request(app)
      .post(`/api/s/${token}/responses`)
      .set('Authorization', `Bearer ${respondent.accessToken}`)
      .send({
        answers: [{ questionId: await getFirstQuestionId(surveyId), textValue: 'Ещё один ответ' }],
      });

    const exported = await request(app)
      .get(`/api/surveys/${surveyId}/results/export`)
      .set('Authorization', `Bearer ${authorToken}`);

    expect(exported.status).toBe(200);
    expect(exported.text).not.toContain('Респондент');
    // Участие видно (PUBLIC_LIST), но не в CSV с ответами — иначе можно было бы
    // сопоставить порядок строк с участниками и деанонимизировать.
    const participation = await prisma.participation.findUnique({
      where: { surveyId_userId: { surveyId, userId: respondent.userId } },
    });
    expect(participation).not.toBeNull();
  });

  it('includes respondent name and email in CSV export only for NAMED surveys', async () => {
    const { surveyId, token } = await createPublishedSurvey(authorToken, 'NAMED');
    const respondent = await registerUser('CSV Named Respondent');

    await request(app)
      .post(`/api/s/${token}/responses`)
      .set('Authorization', `Bearer ${respondent.accessToken}`)
      .send({
        answers: [{ questionId: await getFirstQuestionId(surveyId), textValue: 'Именной ответ' }],
      });

    const exported = await request(app)
      .get(`/api/surveys/${surveyId}/results/export`)
      .set('Authorization', `Bearer ${authorToken}`);

    expect(exported.status).toBe(200);
    expect(exported.text).toContain('Респондент');
    expect(exported.text).toContain('CSV Named Respondent');
  });
});

async function getFirstQuestionId(surveyId: string): Promise<string> {
  const question = await prisma.question.findFirstOrThrow({ where: { surveyId } });
  return question.id;
}
