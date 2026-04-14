<!-- <p align="center">
  <img src="" alt="Telegraph — The easiest way to build and run Telegram bots" width="100%">
</p> -->

<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/logo-light.svg">
  <img alt="Multica" src="docs/assets/logo-light.svg" width="50">
</picture>

# Telegraph

**The easiest way to build and run Telegram bots.**

no coding required.<br/>
Manage everything from one dashboard with instant deploy and scalable automation.

[![CI](https://github.com/kalanakt/telegraph/actions/workflows/ci.yml/badge.svg)](https://github.com/kalanakt/telegraph/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/kalanakt/telegraph?style=flat)](https://github.com/kalanakt/telegraph/stargazers)

[Website](https://telegraph.us.com) · [Cloud](https://telegraph.us.com/dashboard) · [Telegram](https://t.me/jointelegraph) · [Self-Hosting](SELF_HOSTING.md) · [Contributing](CONTRIBUTING.md)

</div>

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
