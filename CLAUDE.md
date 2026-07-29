# CLAUDE.md

Platform for creating and taking surveys with friends/groups and three anonymity modes. Full context on decisions and architecture lives in [PLAN.md](./PLAN.md) — read it before making structural changes.

## Stack & structure

npm workspaces monorepo:

- `apps/backend` — Express + TypeScript + Prisma + PostgreSQL, layered `routes → controllers → services → prisma` per module under `src/modules/<domain>/`.
- `apps/frontend` — React + Vite + TypeScript + Zustand, FSD-ish layout (`app/pages/widgets/features/entities/shared`). Every component gets its own folder: `Name.tsx`, `Name.module.css`, `index.ts`.
- `packages/shared` — zod schemas, enums, and DTO types imported by both apps as `@forms-assistant/shared`. No build step: it's raw TS, resolved directly by Vite/tsx/vitest. Change a schema here first when a field changes shape.

## Commands (run from repo root)

```bash
npm run dev:backend / dev:frontend   # local dev (needs `docker compose up -d postgres` first)
npm run typecheck / lint / test / build   # across all workspaces
npm run format                       # prettier --write
docker compose up -d --build         # full stack; see README.md
```

## Non-negotiable invariant: anonymity model

This is the one thing to never regress:

- `Response.respondentUserId` must stay `NULL` for `ANONYMOUS` and `PUBLIC_LIST` surveys — only `NAMED` may set it.
- `Participation` (who completed a survey) has **no FK to Response/Answer** — never join them to deanonymize.
- Anonymous resubmission blocking uses a hashed browser cookie token (`AnonymousSubmissionGuard`), never a user id.

Any change touching `apps/backend/src/modules/responses/` or `prisma/schema.prisma` should keep `anonymity.integration.test.ts` passing and extend it if behavior changes.

## Conventions

- Validate all API input with zod schemas from `packages/shared` via `validateBody`/`validateQuery`/`validateParams` middleware — don't hand-roll checks in controllers.
- Errors: throw `AppError` subclasses from `lib/errors.ts`; the global `errorHandler` maps them to responses. Don't `res.status().json()` errors manually in controllers.
- Frontend data fetching goes through `shared/api/client.ts` (`api.get/post/patch/delete`), which attaches the access token and silently retries once via refresh on 401.
- Zustand selectors must return primitives/single fields, never a freshly-built object (`useStore(s => ({a: s.a, b: s.b}))` causes infinite re-renders — select `a` and `b` separately). This has bitten this codebase once already.
- Prisma is the source of truth for the schema; after editing `schema.prisma` run `npm run prisma:migrate --workspace=@forms-assistant/backend` and regenerate the client.
- Conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`), one commit per logical change — see git log for the established style.

## Known environment gotchas (Windows dev machine)

- `npm install` on this network is flaky on large packages (Prisma/esbuild); retry rather than assume a real bug. `.npmrc` already sets generous `fetch-retries`.
- Docker builds must `COPY tsconfig.base.json` into any stage that runs `tsc`/`vite` (both `apps/*/tsconfig.json` extend it) and the backend bundles `@forms-assistant/shared` via `tsup.config.ts`'s `noExternal` — don't remove either or the images break silently in ways that work fine locally (masked by tsc's incremental cache / dev-mode module resolution).
