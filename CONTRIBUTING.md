# Contributing

Thanks for contributing to Telegraph. This guide covers local development, testing, and deployment for the monorepo.

## Project Layout

- `apps/web` - Next.js 15 app for the dashboard, APIs, blog, and Telegram webhooks
- `apps/worker` - BullMQ worker that processes queued actions
- `packages/shared` - shared orchestrator, domain logic, validation, Telegram helpers, and queue contracts
- `prisma/` - PostgreSQL schema
- `tests/` - Vitest unit and integration tests

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL
- Redis

## Initial Setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy env vars:

```bash
cp .env.example .env
```

3. Set the minimum required values in `.env`:

- `DATABASE_URL`
- `REDIS_URL`
- `ENCRYPTION_KEY`
- `TELEGRAM_WEBHOOK_BASE_URL`

4. Generate Prisma client:

```bash
pnpm prisma:generate
```

5. Apply the schema to your local database:

```bash
pnpm prisma:push
```

Use `pnpm prisma:migrate` instead when you need a real migration file.

## Local Development

Run the web app and worker in separate terminals.

Web:

```bash
pnpm dev:web
```

Worker:

```bash
pnpm dev:worker
```

The dashboard runs at `http://localhost:3000`.

### Telegram Webhooks in Local Dev

Telegram requires a public HTTPS webhook URL. A typical setup is:

```bash
ngrok http 3000
```

Then set:

```bash
TELEGRAM_WEBHOOK_BASE_URL=https://<ngrok-domain>/api/telegram/webhook
```

Each bot webhook is registered as:

```text
https://<ngrok-domain>/api/telegram/webhook/<botId>
```

If you set `TELEGRAM_WEBHOOK_SECRET_TOKEN`, Telegraph will also verify the incoming Telegram webhook secret header.

## Common Commands

```bash
pnpm dev:web
pnpm dev:worker
pnpm test
pnpm test:watch
pnpm build
pnpm build:shared
pnpm prisma:generate
pnpm prisma:push
pnpm prisma:migrate
pnpm typecheck
pnpm ci:verify
```

Run a single test file with:

```bash
pnpm vitest run tests/unit/evaluator.test.ts
```

## Environment Notes

Optional but commonly needed variables:

- Clerk auth: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Creem billing: `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`, `CREEM_PRO_PRODUCT_ID`, `CREEM_TEST_MODE`
- Public URLs: `NEXT_PUBLIC_SITE_URL`
- File storage: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`
- Error monitoring: `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_ENVIRONMENT`

The app can run without Clerk configured, but auth-protected features are reduced.

## Architecture Summary

Telegram updates follow this path:

1. `POST /api/telegram/webhook/[botId]` receives the update in `apps/web`
2. The web app builds orchestrator adapters and hands off to `packages/shared`
3. The shared orchestrator validates the event, enforces limits, evaluates flows, writes run records, and enqueues action jobs
4. `apps/worker` consumes the BullMQ jobs, calls the Telegram API, and updates statuses

Important implementation details:

- Flow definitions are stored as JSON on `WorkflowRule.flowDefinition`
- Event deduplication uses `{botId}:{updateId}`
- Action idempotency uses `{updateId}:{actionRunId}:{actionType}`
- Bot tokens are encrypted with `ENCRYPTION_KEY`

## Deployment

Telegraph is designed to run as two Railway services:

- `web` - the Next.js app
- `worker` - the background job processor

### Railway Build and Start Commands

Web service:

```bash
pnpm railway:build:web
pnpm railway:start:web
```

Worker service:

```bash
pnpm railway:build:worker
pnpm railway:start:worker
```

### Production Requirements

Make sure both services have access to the same:

- PostgreSQL database
- Redis instance
- app-level environment variables from `.env.example`

At minimum, production should define:

- `DATABASE_URL`
- `REDIS_URL`
- `ENCRYPTION_KEY`
- `TELEGRAM_WEBHOOK_BASE_URL`

Usually also:

- Clerk keys
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_PRO_PRODUCT_ID`
- `NEXT_PUBLIC_SITE_URL`
- S3-compatible storage credentials if uploads are enabled
- `TELEGRAM_WEBHOOK_SECRET_TOKEN` for webhook verification

## Before Opening a PR

- Run `pnpm test`
- Run `pnpm typecheck`
- If you changed the Prisma schema, run `pnpm prisma:generate`
- If you changed shared contracts, make sure both `apps/web` and `apps/worker` still build
