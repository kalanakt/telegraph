# Telegraph

Telegraph is a SaaS platform for building Telegram bot automations with a visual flow builder.

This repository is a `pnpm` monorepo with:
- `apps/web` - Next.js dashboard, API routes, Telegram webhook entrypoint
- `apps/worker` - BullMQ worker that executes queued actions
- `packages/shared` - shared domain logic, orchestrator, validation, queue contracts
- `prisma` - PostgreSQL schema and migrations

## Quick Start

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

The app runs at `http://localhost:3000`.

## Useful Commands

```bash
pnpm dev:web
pnpm dev:worker
pnpm test
pnpm build
```

## Docs

- Contributor guide: `CONTRIBUTING.md`
- Agent guidance: `AGENTS.md`
