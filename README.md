# Telegraph

Telegraph is a SaaS platform for building Telegram bot automations with a visual flow builder.

## Apps

- `apps/web` - Next.js dashboard, API routes, and Telegram webhook entrypoint
- `apps/worker` - BullMQ worker that executes queued actions
- `packages/shared` - shared domain logic, orchestrator, validation, and Telegram helpers
- `prisma` - PostgreSQL schema and migrations
- `tests` - Vitest tests

## Local development

```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:push
pnpm dev:web
```

Run the worker in a second terminal:

```bash
pnpm dev:worker
```

## Common commands

```bash
pnpm dev:web
pnpm dev:worker
pnpm test
pnpm build
pnpm prisma:generate
pnpm prisma:push
pnpm prisma:migrate
```

## Required environment variables

- `DATABASE_URL`
- `REDIS_URL`
- `ENCRYPTION_KEY`
- `TELEGRAM_WEBHOOK_BASE_URL`

See [`.env.example`](/Users/kalanakt/Dev/netronk/telegraph.dev/.env.example) for the full list.
