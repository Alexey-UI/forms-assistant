import { PrismaClient, SurveyAnonymityMode, QuestionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', passwordHash: password, displayName: 'Alice' },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', passwordHash: password, displayName: 'Bob' },
  });

  await prisma.friendRequest.upsert({
    where: { fromUserId_toUserId: { fromUserId: alice.id, toUserId: bob.id } },
    update: {},
    create: { fromUserId: alice.id, toUserId: bob.id, status: 'ACCEPTED' },
  });

  const group = await prisma.group.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo team',
      createdById: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.survey.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Обратная связь по демо',
      description: 'Пример именного опроса',
      authorId: alice.id,
      anonymityMode: SurveyAnonymityMode.NAMED,
      status: 'PUBLISHED',
      allowMultipleSubmissions: false,
      groupShares: { create: [{ groupId: group.id }] },
      questions: {
        create: [
          {
            type: QuestionType.SINGLE_CHOICE,
            text: 'Вам понравился продукт?',
            required: true,
            order: 0,
            options: {
              create: [
                { text: 'Да', order: 0 },
                { text: 'Нет', order: 1 },
              ],
            },
          },
          {
            type: QuestionType.TEXT,
            text: 'Что можно улучшить?',
            required: false,
            order: 1,
          },
        ],
      },
    },
  });

  console.log('Seed complete:', { alice: alice.email, bob: bob.email, group: group.name });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
