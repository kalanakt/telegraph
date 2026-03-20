FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./

FROM base AS install
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/schemas/package.json packages/schemas/package.json
COPY packages/flow-compiler/package.json packages/flow-compiler/package.json
COPY packages/telemetry/package.json packages/telemetry/package.json
COPY apps/runtime/package.json apps/runtime/package.json
RUN pnpm install --frozen-lockfile

FROM install AS build
COPY packages/ packages/
COPY apps/runtime/ apps/runtime/
RUN pnpm --filter @telegraph/runtime build

FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY --from=build /app ./
ENV NODE_ENV=production PORT=3002
EXPOSE 3002
CMD ["node", "apps/runtime/dist/server.js"]
