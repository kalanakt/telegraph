# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

Telegraph is a SaaS platform for building Telegram bot automations via a visual flow builder. It's a pnpm monorepo with two deployable apps and a shared domain library.

- `apps/web` — Next.js 15 dashboard, API routes, flow builder UI
- `apps/worker` — BullMQ worker that consumes and executes queued actions
- `packages/shared` — Core domain logic, orchestrator, Telegram client, validation, queue contracts
- `prisma/` — PostgreSQL schema and migrations
- `tests/` — Vitest unit and integration tests (co-located at repo root, not per-app)

## Commands

```bash
# Development (run in separate terminals)
pnpm dev:web          # Next.js app at http://localhost:3000
pnpm dev:worker       # Worker in watch mode

# Database
pnpm prisma:generate  # Generate Prisma client after schema changes
pnpm prisma:push      # Push schema to DB (dev/quick iteration)
pnpm prisma:migrate   # Run Prisma migrations (creates migration files)

# Build
pnpm build            # Build all packages/apps
pnpm build:shared     # Build shared package only

# Tests
pnpm test             # Run all Vitest tests once
pnpm test:watch       # Run Vitest in watch mode
```

To run a single test file:
```bash
pnpm vitest run tests/unit/evaluator.test.ts
```

## Architecture: Event Processing Pipeline

Telegram updates flow through this pipeline:

1. `POST /api/telegram/webhook/[botId]` (web app) receives the update
2. `apps/web/lib/orchestrator/service.ts` instantiates the orchestrator with DB adapters from `adapters.ts`
3. `packages/shared/src/orchestrator/orchestrator.ts` — core logic:
   - Validates/normalizes the Telegram update (`normalize.ts`)
   - Checks bot status, plan limits, deduplicates via `IncomingEvent` table
   - Evaluates enabled `WorkflowRule` flows against the event
   - Derives actions from matching flows (`domain/flow.ts`)
   - Creates `WorkflowRun` + `ActionRun` DB records, enqueues jobs to Redis
4. `apps/worker/src/processor.ts` consumes `ActionJob` items from the BullMQ `actions` queue, calls Telegram API, updates run statuses

The orchestrator is injected with adapters (not direct Prisma calls), making the core domain logic independently testable.

## Key Architectural Decisions

**Shared package exports** (`packages/shared/src/index.ts`): All domain types, validation schemas (Zod), the orchestrator contract, Telegram client, and queue job contracts flow through here. The web app and worker both consume this package.

**Flow definition**: A `WorkflowRule` stores a `flowDefinition` JSON field representing the React Flow canvas state. `domain/flow.ts` in shared derives action payloads from this graph structure. `apps/web/lib/flow-builder.ts` defines the UI-level trigger/action/condition groups.

**Billing enforcement**: Clerk handles auth and subscription plans. Webhook at `/api/webhooks/clerk` syncs plan status to the DB. Orchestrator checks entitlements via `packages/shared/src/config/limits.ts` before processing.

**Bot token security**: Tokens are encrypted at rest using `ENCRYPTION_KEY` via `packages/shared/src/domain/encryption.ts`.

**Idempotency**: Events are deduplicated by `{botId}:{updateId}` in the `IncomingEvent` table. Action-level idempotency keys are `{updateId}:{actionRunId}:{actionType}`.

## TypeScript Path Aliases

- `@shared/*` → `packages/shared/src/*` (available in web and worker)
- `@/*` → `apps/web/*` (available in tests via vitest config)

## Protected Routes

Clerk middleware (`apps/web/middleware.ts`) protects: `/dashboard`, `/bots`, `/builder`, `/runs`, `/api/bots`, `/api/builder`, `/api/runs`. Public routes include `/`, `/blog`, `/pricing`, `/pricing`, `/privacy`, `/terms`. Auth is optional — the app runs without Clerk env vars but with reduced functionality.

## Blog System

MDX posts in `apps/web/content/blog/*.mdx`. Filename = slug. Required frontmatter: `title`, `description`, `publishedAt` (ISO date), `tags` (array). Posts with `draft: true` are hidden in production.

## Environment Setup

Copy `.env.example` to `.env`. Minimum required:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `ENCRYPTION_KEY` — 32+ char secret for bot token encryption
- `TELEGRAM_WEBHOOK_BASE_URL` — public HTTPS URL (use `ngrok http 3000` locally)

For Telegram webhooks during local dev, run `ngrok http 3000` and set `TELEGRAM_WEBHOOK_BASE_URL=https://<ngrok-domain>/api/telegram/webhook`. The webhook URL per bot becomes `{base_url}/{botId}`.

## Deployment

Two Railway services: `web` (Next.js) and `worker` (Node.js). See `deploy.md` for the Railway setup runbook.
