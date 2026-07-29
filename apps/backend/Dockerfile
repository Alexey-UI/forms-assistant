# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /repo

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm install --no-audit --no-fund

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN npm run prisma:generate --workspace=@forms-assistant/backend
RUN npm run build --workspace=@forms-assistant/backend

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /repo/apps/backend
COPY --from=build /repo/apps/backend/dist ./dist
COPY --from=build /repo/apps/backend/prisma ./prisma
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/apps/backend/package.json ./package.json
EXPOSE 4000
CMD ["node", "dist/src/index.js"]
