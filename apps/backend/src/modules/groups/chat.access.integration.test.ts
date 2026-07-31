import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
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

async function createGroupWithMember(adminToken: string, memberUserId: string) {
  const created = await request(app)
    .post('/api/groups')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: `Chat test group ${randomUUID()}` });
  const groupId = created.body.id as string;

  await request(app)
    .post(`/api/groups/${groupId}/members`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId: memberUserId });

  return groupId;
}

describe('group chat access control', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects a non-member from reading and writing group chat', async () => {
    const admin = await registerUser('Chat Admin 1');
    const member = await registerUser('Chat Member 1');
    const outsider = await registerUser('Chat Outsider 1');
    const groupId = await createGroupWithMember(admin.accessToken, member.userId);

    const readAttempt = await request(app)
      .get(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${outsider.accessToken}`);
    expect(readAttempt.status).toBe(403);

    const writeAttempt = await request(app)
      .post(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({ text: 'Should not be allowed' });
    expect(writeAttempt.status).toBe(403);
  });

  it('rejects a muted member from sending messages, but still allows reading', async () => {
    const admin = await registerUser('Chat Admin 2');
    const member = await registerUser('Chat Member 2');
    const groupId = await createGroupWithMember(admin.accessToken, member.userId);

    const mute = await request(app)
      .patch(`/api/groups/${groupId}/members/${member.userId}/write-access`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ canWrite: false });
    expect(mute.status).toBe(204);

    const writeAttempt = await request(app)
      .post(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ text: 'I am muted' });
    expect(writeAttempt.status).toBe(403);

    const readAttempt = await request(app)
      .get(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(readAttempt.status).toBe(200);
  });

  it('rejects a non-admin from muting other members', async () => {
    const admin = await registerUser('Chat Admin 3');
    const member = await registerUser('Chat Member 3');
    const groupId = await createGroupWithMember(admin.accessToken, member.userId);

    const muteAttempt = await request(app)
      .patch(`/api/groups/${groupId}/members/${admin.userId}/write-access`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ canWrite: false });
    expect(muteAttempt.status).toBe(403);
  });

  it('allows only the author or an admin to delete a message', async () => {
    const admin = await registerUser('Chat Admin 4');
    const member = await registerUser('Chat Member 4');
    const otherMember = await registerUser('Chat Member 5');
    const groupId = await createGroupWithMember(admin.accessToken, member.userId);
    await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ userId: otherMember.userId });

    const sent = await request(app)
      .post(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ text: 'Delete me maybe' });
    expect(sent.status).toBe(201);
    const messageId = sent.body.id as string;

    const deniedDelete = await request(app)
      .delete(`/api/groups/${groupId}/messages/${messageId}`)
      .set('Authorization', `Bearer ${otherMember.accessToken}`);
    expect(deniedDelete.status).toBe(403);

    const adminDelete = await request(app)
      .delete(`/api/groups/${groupId}/messages/${messageId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(adminDelete.status).toBe(204);
  });

  it('allows the message author to edit their own message but rejects other members', async () => {
    const admin = await registerUser('Chat Admin 6');
    const member = await registerUser('Chat Member 6');
    const groupId = await createGroupWithMember(admin.accessToken, member.userId);

    const sent = await request(app)
      .post(`/api/groups/${groupId}/messages`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ text: 'Original text' });
    expect(sent.status).toBe(201);
    const messageId = sent.body.id as string;

    const deniedEdit = await request(app)
      .patch(`/api/groups/${groupId}/messages/${messageId}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ text: 'Hijacked text' });
    expect(deniedEdit.status).toBe(403);

    const ownEdit = await request(app)
      .patch(`/api/groups/${groupId}/messages/${messageId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ text: 'Edited by author' });
    expect(ownEdit.status).toBe(200);
    expect(ownEdit.body.text).toBe('Edited by author');
  });

  it('rejects a non-admin from adding or removing group members', async () => {
    const admin = await registerUser('Chat Admin 7');
    const member = await registerUser('Chat Member 7');
    const outsider = await registerUser('Chat Outsider 7');
    const groupId = await createGroupWithMember(admin.accessToken, member.userId);

    const deniedAdd = await request(app)
      .post(`/api/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ userId: outsider.userId });
    expect(deniedAdd.status).toBe(403);

    const deniedRemove = await request(app)
      .delete(`/api/groups/${groupId}/members/${admin.userId}`)
      .set('Authorization', `Bearer ${member.accessToken}`);
    expect(deniedRemove.status).toBe(403);
  });
});
