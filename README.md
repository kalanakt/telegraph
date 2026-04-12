# Telegraph

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/wbEZgQ?referralCode=monthfree&utm_medium=integration&utm_source=template&utm_campaign=generic)

Telegraph is an open-source platform for building Telegram bot automations with a visual flow builder, queue-backed execution, and run history.

It is built for teams that want more than a single webhook handler: design flows visually, process updates through a reliable pipeline, and inspect what happened when a run succeeds or fails.

## What Telegraph Includes

- Visual flow builder for Telegram automations
- Telegram webhook intake and normalization
- Queue-backed action execution with BullMQ
- Workflow run and action run tracking
- Shared domain layer for orchestration, validation, and Telegram contracts
- Dashboard app, worker process, and PostgreSQL schema in one monorepo

## Monorepo Layout

- `apps/web` - Next.js dashboard, API routes, blog, and Telegram webhook entrypoint
- `apps/worker` - BullMQ worker that executes queued actions
- `packages/shared` - shared domain logic, orchestrator, validation, Telegram helpers, and queue contracts
- `prisma` - PostgreSQL schema and migrations
- `tests` - Vitest unit and integration tests

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Prisma + PostgreSQL
- Redis + BullMQ
- Vitest

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL
- Redis

### Local setup

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:push
pnpm dev:web
```

In a second terminal:

```bash
pnpm dev:worker
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

Minimum local setup:

- `DATABASE_URL`
- `REDIS_URL`
- `ENCRYPTION_KEY`
- `TELEGRAM_WEBHOOK_BASE_URL`

Common optional values:

- Clerk auth: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Billing: `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`, `CREEM_PRO_PRODUCT_ID`
- Public app URL: `NEXT_PUBLIC_SITE_URL`
- Media uploads: `ENABLE_MEDIA_UPLOADS`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- Error monitoring: `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_ENVIRONMENT`

See [`.env.example`](./.env.example) for the full list.

## Telegram Webhooks in Local Development

Telegram requires a public HTTPS endpoint. For local development, expose the web app with a tunneling tool such as:

```bash
ngrok http 3000
```

Then set:

```bash
TELEGRAM_WEBHOOK_BASE_URL=https://<your-ngrok-domain>/api/telegram/webhook
```

Each bot webhook is registered as:

```text
https://<your-ngrok-domain>/api/telegram/webhook/<botId>
```

## Common Commands

```bash
pnpm dev:web
pnpm dev:worker
pnpm test
pnpm test:watch
pnpm typecheck
pnpm build
pnpm ci:verify
pnpm prisma:generate
pnpm prisma:push
pnpm prisma:migrate
```

Run a single test file:

```bash
pnpm vitest run tests/unit/evaluator.test.ts
```

## Architecture Overview

Telegram updates flow through Telegraph like this:

1. `POST /api/telegram/webhook/[botId]` receives an update in `apps/web`
2. The web app builds adapters and hands off to the shared orchestrator
3. The shared orchestrator validates the event, enforces limits, deduplicates updates, evaluates workflows, writes run records, and enqueues jobs
4. `apps/worker` consumes the queue, calls the Telegram API, and updates run statuses

Important implementation details:

- Flow definitions are stored as JSON on `WorkflowRule.flowDefinition`
- Event deduplication uses `{botId}:{updateId}`
- Action idempotency uses `{updateId}:{actionRunId}:{actionType}`
- Bot tokens are encrypted at rest with `ENCRYPTION_KEY`

## Deployment

Use the Railway button above for a one-click deploy.

For self-hosting, Telegraph expects:

- one web service
- one worker service
- PostgreSQL
- Redis

Both services should share the same database, Redis instance, and application environment variables.

## Contributing

Contributions are welcome. Start with [`CONTRIBUTING.md`](./CONTRIBUTING.md).
