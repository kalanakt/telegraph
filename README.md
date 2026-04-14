<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/assets/logo-light.svg">
  <img alt="Telegraph" src="docs/assets/logo-light.svg" width="50">
</picture>

# Telegraph

**Build and run Telegram bot automations with a visual flow builder.**

[![CI](https://github.com/kalanakt/telegraph/actions/workflows/ci.yml/badge.svg)](https://github.com/kalanakt/telegraph/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/kalanakt/telegraph?style=flat)](https://github.com/kalanakt/telegraph/stargazers)

[Website](https://telegraph.us.com) · [Cloud](https://telegraph.us.com/dashboard) · [Telegram](https://t.me/jointelegraph) · [Contributing](CONTRIBUTING.md)

</div>

## What Is Telegraph?

Telegraph is a SaaS platform for building Telegram bot automations without hand-writing the execution layer yourself. It combines a visual builder, webhook ingestion, workflow orchestration, queued action processing, and operational safeguards into one system for shipping Telegram bots at scale.

## Features

- Visual flow builder for Telegram automations
- Trigger, condition, and action-driven workflow execution
- Shared orchestrator logic used by both the web app and worker
- BullMQ-backed action processing for reliable async execution
- Billing and plan-limit enforcement during orchestration
- Encrypted bot token storage with application-level security
- Event deduplication and action idempotency for safer replays

## Architecture

<p align="center">
  <img src="assets/architecture.svg" alt="telegraph mermaid architecture graph" width="100%">
</p>

## Repository Layout

| Path | Responsibility |
| --- | --- |
| `apps/web` | Next.js dashboard, API routes, webhook entrypoint, and flow builder UI |
| `apps/worker` | BullMQ worker that consumes and executes queued actions |
| `packages/shared` | Core domain logic, orchestrator, Telegram client, validation, and queue contracts |
| `prisma` | PostgreSQL schema and migrations |
| `tests` | Vitest unit and integration tests |

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development workflow, worktree support, testing, and troubleshooting.
