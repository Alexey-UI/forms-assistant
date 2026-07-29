# Forms Assistant

Платформа для создания и прохождения опросов с друзьями/группами и тремя режимами анонимности. Архитектура, модель данных и статус эпиков — в [PLAN.md](./PLAN.md).

## Стек

- **Backend**: Express + TypeScript + Prisma + PostgreSQL, JWT-аутентификация
- **Frontend**: React + Vite + TypeScript + Zustand + React Router
- **Монорепо**: npm workspaces (`apps/backend`, `apps/frontend`, `packages/shared`)

## Локальная разработка

Требуется Node.js 20+ и Docker (для Postgres).

```bash
npm install
docker compose up -d postgres

cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

npm run prisma:migrate --workspace=@forms-assistant/backend
npm run prisma:seed --workspace=@forms-assistant/backend   # опционально, тестовые данные

npm run dev:backend   # http://localhost:4000
npm run dev:frontend  # http://localhost:5173
```

Тестовые пользователи после seed: `alice@example.com` / `bob@example.com`, пароль `password123`.

## Полный стек в Docker

```bash
cp apps/backend/.env.example apps/backend/.env   # заменить секреты для прода
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

Frontend (nginx, проксирует `/api` на backend) — `http://localhost:5173`. Для продакшена — `docker-compose.prod.yml` поверх основного файла:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Домен/DNS/TLS настраиваются отдельно при появлении сервера.

## Проверки

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
