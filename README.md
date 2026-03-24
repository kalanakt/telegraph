# Telegraph Bot Builder

A PNPM monorepo for building and running Telegram bot automations.

It includes:
- `apps/web`: Next.js app (dashboard, bot/flow management, webhook + API routes)
- `apps/worker`: BullMQ worker that executes queued actions (for now: `send_message`)
- `packages/shared`: shared orchestrator, domain logic, validation, Telegram helpers, and queue contracts
- `prisma`: Postgres schema and Prisma client setup
- `tests`: unit + integration tests for orchestrator and worker behavior

## Tech Stack

- Next.js 15 + React 19
- TypeScript
- Prisma + PostgreSQL
- BullMQ + Redis
- Clerk (auth)
- Clerk Billing (subscription + entitlements)
- Vitest

## Architecture Overview

1. Telegram sends an update to `POST /api/telegram/webhook/:botId`.
2. The web app orchestrator validates/normalizes the event, checks plan limits, evaluates enabled flows, and creates workflow/action run records.
3. Matching actions are enqueued in Redis (`actions` queue via BullMQ).
4. The worker consumes action jobs, calls Telegram `sendMessage`, updates action/run statuses, and pushes failed terminal jobs to a dead-letter queue.

## Prerequisites

- Node.js 20+
- PNPM 10+
- PostgreSQL (local or remote)
- Redis (local or remote)

## Environment Variables

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required for local development:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `ENCRYPTION_KEY` - secret used to encrypt Telegram bot tokens
- `TELEGRAM_WEBHOOK_BASE_URL` - public HTTPS base URL for Telegram webhooks, e.g. `https://<your-tunnel>/api/telegram/webhook`

Required for authentication-enabled flows:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Optional (billing/pro plan sync):

- `CLERK_WEBHOOK_SIGNING_SECRET`
- `CLERK_BILLING_PRO_PLAN_SLUGS` (comma-separated plan slugs treated as `PRO`, default: `pro`)
- Configure Clerk webhook endpoint: `POST /api/webhooks/clerk`

Optional (public metadata and RSS canonical URLs):

- `NEXT_PUBLIC_SITE_URL` (for example `https://telegraph.dev`)

## Install

```bash
pnpm install
```

## Database Setup

Generate Prisma client:

```bash
pnpm prisma:generate
```

Apply schema to your DB (choose one):

```bash
pnpm prisma:push
```

or

```bash
pnpm prisma:migrate
```

## Local Development

Run both web and worker in separate terminals.

Terminal 1 (web):

```bash
pnpm dev:web
```

Terminal 2 (worker):

```bash
pnpm dev:worker
```

App URL:
- `http://localhost:3000`

### Telegram Webhook in Local Dev

Telegram requires a public HTTPS webhook URL. For local development, run a tunnel (for example `ngrok`):

```bash
ngrok http 3000
```

Then set:

- `TELEGRAM_WEBHOOK_BASE_URL=https://<ngrok-domain>/api/telegram/webhook`

When you add a bot from `/bots`, the app calls Telegram `setWebhook` with:

- `https://<ngrok-domain>/api/telegram/webhook/<botId>`

## Scripts

From repo root:

- `pnpm dev:web` - start Next.js app
- `pnpm dev:worker` - start worker in watch mode
- `pnpm build` - build all workspace packages/apps
- `pnpm test` - run Vitest once
- `pnpm test:watch` - run Vitest in watch mode
- `pnpm prisma:generate` - generate Prisma client
- `pnpm prisma:migrate` - run Prisma migrations (dev)
- `pnpm prisma:push` - push schema to database
- `pnpm migrate:flow-backfill` - backfill `flowDefinition` for existing rules
- `pnpm railway:build:web` - Railway build command for web service
- `pnpm railway:start:web` - Railway start command for web service
- `pnpm railway:build:worker` - Railway build command for worker service
- `pnpm railway:start:worker` - Railway start command for worker service

## Testing

```bash
pnpm test
```

## Current Product Scope

- Connect Telegram bots by BotFather token
- Create `message_received` automation flows
- Supported condition operators: text-based match types (see shared orchestrator/evaluator)
- Supported action type: `send_message`
- Track workflow and action run history
- Free/Pro plan limits enforced in app logic

## Blog Authoring (MDX)

- Blog posts live in `apps/web/content/blog/*.mdx`.
- File names are used as slugs (for example `launch-notes.mdx` -> `/blog/launch-notes`).
- Required frontmatter:
  - `title`
  - `description`
  - `publishedAt` (ISO date string)
  - `tags` (array of strings)
- Optional frontmatter:
  - `updatedAt`
  - `author`
  - `coverImage`
  - `draft`
- Draft behavior:
  - `draft: true` is hidden from public blog output in production.
  - RSS includes published posts only.
- Blog filtering:
  - `q` matches title, description, and tags.
  - `tag` performs case-insensitive exact tag filtering.

## Notes

- Most app pages and API routes are user-protected via Clerk auth.
- If `CLERK_WEBHOOK_SIGNING_SECRET` is missing, Clerk billing webhook sync is disabled.
- If `ENCRYPTION_KEY` is unchanged/weak, bot token security is reduced.
- Railway deployment runbook: `deploy.md`
