# Forms Assistant

Платформа для создания и прохождения опросов внутри своего круга — друзей и групп, а не анонимной массовой аудитории. Пользователь регистрируется, добавляет друзей (заявка → подтверждение) и заводит группы с ролями участник/админ; админ управляет составом и правами. Опрос собирается из вопросов трёх типов (одиночный/множественный выбор, текст) с флагом обязательности и делится по ссылке, приглашением в группу или напрямую другу. У каждой группы есть свой групповой чат в реальном времени (Socket.IO) с историей сообщений, mute-правами и бейджем непрочитанных.

Ключевая особенность — три режима анонимности ответов, зашитые не только в UI, но и в структуру БД: `ANONYMOUS` (личность отвечавшего нигде не связывается с ответом — таблица участия и таблица ответов физически не пересекаются), `PUBLIC_LIST` (видно, кто участвовал, но не видно, кто что ответил) и `NAMED` (ответы подписаны). Автор опроса видит агрегированную аналитику (счётчики/проценты по выборным вопросам, список текстовых ответов) без возможности деанонимизировать `ANONYMOUS`-опрос даже случайно.

Архитектура, модель данных и статус эпиков — в [PLAN.md](./PLAN.md). Инфраструктура демо-развёртывания (Yandex Cloud, Kubernetes, CI/CD) — в [INFRASTRUCTURE.md](./INFRASTRUCTURE.md), живой стенд: **https://app.alexey-sdvizhkov.ru**.

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

## Продакшен-стенд в облаке

Помимо docker-compose, в репозитории есть полноценный демо-стенд в Yandex Cloud — Terraform поднимает VM/сеть/DNS/Container Registry, на VM разворачивается **k3s** (Kubernetes), приложение упаковано в Docker-образы и задеплоено манифестами (`infra/k8s/`), снаружи — **Traefik** как Ingress/балансировщик с TLS от Let's Encrypt через **cert-manager**. Пуш в `master` прогоняет тесты, собирает образы, пушит их в Container Registry и раскатывает в кластер через GitHub Actions (`.github/workflows/ci.yml`).

Подробный разбор — с диаграммами, списком ресурсов, обоснованием решений (почему k3s, а не managed-кластер; как устроены секреты и разделение прав между сервисными аккаунтами; как работает выпуск сертификата) — в **[INFRASTRUCTURE.md](./INFRASTRUCTURE.md)**. Код инфраструктуры — в `infra/` (`terraform/`, `k8s/`, `scripts/`).

## Проверки

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
