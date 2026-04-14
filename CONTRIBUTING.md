# Contributing

Thanks for contributing to Telegraph. This guide covers local development, worktree-friendly collaboration, testing, and common troubleshooting paths for the monorepo.

## Project Layout

- `apps/web` - Next.js 15 dashboard, API routes, blog, and Telegram webhook entrypoint
- `apps/worker` - BullMQ worker that processes queued actions
- `packages/shared` - shared orchestrator, domain logic, validation, Telegram helpers, and queue contracts
- `prisma/` - PostgreSQL schema and migrations
- `tests/` - Vitest unit and integration tests

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL
- Redis

## Development Workflow

1. Install dependencies:

```bash
pnpm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Set the minimum required values in `.env`:

- `DATABASE_URL`
- `REDIS_URL`
- `ENCRYPTION_KEY`
- `TELEGRAM_WEBHOOK_BASE_URL`

4. Generate the Prisma client:

```bash
pnpm prisma:generate
```

5. Apply the schema to your local database:

```bash
pnpm prisma:push
```

Use `pnpm prisma:migrate` instead when you need a real migration file.

6. Run the web app and worker in separate terminals:

```bash
pnpm dev:web
pnpm dev:worker
```

The dashboard runs at `http://localhost:3000`.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev:web` | Start the Next.js app after rebuilding the shared package |
| `pnpm dev:worker` | Start the BullMQ worker in watch mode after rebuilding the shared package |
| `pnpm build` | Build all packages and apps in the monorepo |
| `pnpm build:shared` | Build only the shared domain package |
| `pnpm test` | Run the full Vitest suite once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm typecheck` | Run TypeScript checks for shared, worker, and web |
| `pnpm ci:verify` | Run Prisma generate, typecheck, and tests in one pass |
| `pnpm prisma:generate` | Generate the Prisma client |
| `pnpm prisma:push` | Push the current Prisma schema to the local database |
| `pnpm prisma:migrate` | Create and apply a development migration |
| `pnpm railway:build:web` | Build the Railway web service artifact |
| `pnpm railway:start:web` | Start the Railway web service |
| `pnpm railway:build:worker` | Build the Railway worker artifact |
| `pnpm railway:start:worker` | Start the Railway worker service |
| `pnpm railway:migrate` | Apply production migrations with `prisma migrate deploy` |
| `pnpm db:seed:templates` | Seed workflow templates into the database |

Run a single test file with:

```bash
pnpm vitest run tests/unit/evaluator.test.ts
```

## Telegram Webhooks In Local Development

Telegram requires a public HTTPS webhook URL. A typical local setup is:

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

## Environment Notes

Optional but commonly needed variables:

- Clerk auth: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Creem billing: `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`, `CREEM_PRO_PRODUCT_ID`, `CREEM_PRO_MONTHLY_PRODUCT_ID`, `CREEM_PRO_YEARLY_PRODUCT_ID`, `CREEM_TEST_MODE`
- Public URLs: `NEXT_PUBLIC_SITE_URL`
- File storage: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`
- Error monitoring: `SENTRY_DSN`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_ENVIRONMENT`

The app can run without Clerk configured, but auth-protected features are reduced.

## Testing And Verification

Before opening a PR:

- Run `pnpm test`
- Run `pnpm typecheck`
- Run `pnpm prisma:generate` if you changed the Prisma schema
- Build affected packages if you changed shared contracts or runtime behavior

The most complete local verification pass is:

```bash
pnpm ci:verify
```

## Worktree Support

If you want isolated feature work without disturbing your current branch, use a Git worktree:

```bash
git worktree add ../telegraph-docs-update -b codex/docs-update
```

That creates a sibling checkout on a new branch. Run `pnpm install` inside the new worktree before starting development, then use the same commands from this guide there.

List active worktrees with:

```bash
git worktree list
```

Remove a finished worktree with:

```bash
git worktree remove ../telegraph-docs-update
```

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

## Deployment Notes

Telegraph is designed to run as two Railway services:

- `web` - the Next.js app
- `worker` - the background job processor

Make sure both services have access to the same PostgreSQL database, Redis instance, and app-level environment variables from `.env.example`.

See `docs/railway-production.md` for the production deploy checklist and env ownership split.

## Troubleshooting

### `pnpm dev:web` or `pnpm dev:worker` fails after shared-package changes

Run:

```bash
pnpm build:shared
```

Both dev scripts already rebuild shared first, but running it directly is a fast reset when stale build output is involved.

### Prisma client errors after schema changes

Run:

```bash
pnpm prisma:generate
```

If your local database also drifted from the schema, follow with `pnpm prisma:push`.

### Telegram webhooks are not firing locally

Verify that your ngrok tunnel is still active and that `TELEGRAM_WEBHOOK_BASE_URL` points at the current HTTPS tunnel URL. Telegram will not deliver to plain localhost URLs.

### TypeScript errors mention `.next/types`

Run:

```bash
pnpm typecheck
```

The repo typecheck script clears stale `apps/web/.next/types` output before checking the web app.
