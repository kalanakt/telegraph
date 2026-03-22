# Telegraph

A multi-tenant platform for building Telegram bots with a visual flow editor. Design conversation flows by dragging and connecting nodes on a canvas, publish them with one click, and let the runtime handle the rest — webhook ingestion, session management, AI completions, payments, and outbound messaging.

---

## Features

### Visual Flow Editor

Build bot logic without writing code. The Vue Flow-based editor supports **10 node types** across three categories:

| Category         | Nodes                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Triggers**     | `/command`, message pattern (exact / contains / regex), inline callback button                                                  |
| **Actions**      | Send text message (HTML / Markdown), send media (photo / video / document / audio), HTTP request, AI prompt (OpenAI-compatible) |
| **Flow Control** | Conditional branching (eq / neq / contains / gt / lt / regex), set session variable, wait for user input                        |

Drag nodes from the palette, connect them with edges, configure properties in the side panel, and hit **Publish** to compile and deploy.

### One-Click Publish

The [flow compiler](packages/flow-compiler/src/compiler.ts) validates the graph (reachability, cycle detection, trigger presence), resolves triggers, and emits an execution plan that the runtime picks up instantly via Redis cache invalidation.

### Worker Pipeline

The runtime processes Telegram updates through a BullMQ job pipeline:

```
Telegram webhook
  → update worker (10 concurrency) — parse update, match triggers, load session
    → execute worker (5) — walk plan nodes, manage state machine
      → outbound worker (10) — send messages via grammY with rate limiting
      → ai worker (3) — call OpenAI-compatible API, resume execution
      → payment worker (5) — handle pre-checkout & successful payment
```

### Multi-Tenancy

Every resource (bots, flows, plans) is scoped to a tenant. Users register with an organization name and are issued JWTs containing `tenantId`. Row-level tenant isolation is enforced across all API routes.

### Security

- **Bot tokens** encrypted at rest with AES-256-GCM (per-token IV, authenticated with a 32-byte master key).
- **Webhook verification** via Telegram's `X-Telegram-Bot-Api-Secret-Token` header.
- **SSRF protection** on HTTP request nodes in the execute worker.
- **Rate limiting** on auth endpoints and outbound Telegram API calls (per-bot: 30 msg/s, per-chat: 1 msg/s).

### Observability

OpenTelemetry traces and metrics are exported via gRPC to an OTEL Collector, which forwards to Prometheus. Both the control-plane and runtime expose `/metrics` endpoints for scraping.

---

## Architecture

```
┌──────────────┐       ┌──────────────────┐       ┌───────────────┐
│   Web SPA    │──────▶│  Control Plane   │──────▶│  PostgreSQL   │
│  (Vue 3/     │  API  │  (Fastify :3001) │       │  (Drizzle ORM)│
│   Vite)      │       └──────────────────┘       └───────────────┘
└──────────────┘               │                         ▲
                               │ publish                 │
                               ▼                         │
                        ┌─────────────┐           ┌──────┴──────┐
   Telegram ──webhook──▶│   Runtime   │──────────▶│    Redis     │
                        │(Fastify :3002│  BullMQ   │  (sessions,  │
                        │ + Workers)  │  queues   │   queues,    │
                        └─────────────┘           │   plan cache)│
                                                  └──────────────┘
```

### Monorepo Layout

```
apps/
  control-plane/     Fastify API — auth, bot CRUD, flow management, publish
  runtime/           Webhook server + BullMQ workers
  web/               Vue SPA — dashboard & visual flow editor
packages/
  db/                Drizzle schema, migrations, client
  schemas/           Zod schemas for flow graphs, node types, execution plans
  flow-compiler/     Graph → execution plan compiler
  shared/            Logger (pino), Redis, BullMQ queues, crypto, rate limiter, IDs
  telemetry/         OpenTelemetry SDK, Prometheus metrics
infra/               docker-compose for Postgres, Redis, OTEL Collector, Prometheus
```

---

## Tech Stack

| Layer         | Technology                                                   |
| ------------- | ------------------------------------------------------------ |
| Language      | TypeScript (ES2022, strict mode)                             |
| Monorepo      | pnpm 9.15 workspaces + Turborepo                             |
| Runtime       | Node.js ≥ 22                                                 |
| Backend       | Fastify 5                                                    |
| Frontend      | Vue 3, Vite 6, Tailwind CSS 4, Vue Flow, TanStack Query |
| Database      | PostgreSQL 16, Drizzle ORM                                   |
| Queue & Cache | Redis 7, ioredis, BullMQ                                     |
| Telegram      | grammY                                                       |
| AI            | OpenAI-compatible REST API (default model: `gpt-4o-mini`)    |
| Telemetry     | OpenTelemetry, Prometheus, prom-client                       |
| Testing       | Vitest                                                       |
| Linting       | ESLint 9 (typescript-eslint + Prettier)                      |

---

## Local Development

### Prerequisites

- **Node.js** ≥ 22
- **pnpm** 9.15+ (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker** & Docker Compose (for Postgres, Redis, observability stack)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start infrastructure

```bash
pnpm infra:up
```

This launches PostgreSQL 16, Redis 7, an OpenTelemetry Collector, and Prometheus.

### 3. Configure environment

Copy `.env.example` → `.env` in each app directory and fill in secrets:

```bash
cp apps/control-plane/.env.example apps/control-plane/.env
cp apps/runtime/.env.example        apps/runtime/.env
cp apps/web/.env.example             apps/web/.env
```

Key variables:

| Variable                   | App                    | Description                                                                         |
| -------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `DATABASE_URL`             | control-plane, runtime | Postgres connection string                                                          |
| `REDIS_URL`                | control-plane, runtime | Redis connection string                                                             |
| `JWT_SECRET`               | control-plane          | Secret for signing JWTs                                                             |
| `BOT_TOKEN_MASTER_KEY`     | control-plane, runtime | Base64-encoded 32-byte key for AES-256-GCM token encryption                         |
| `DEFAULT_WEBHOOK_BASE_URL` | control-plane          | Optional HTTPS base URL for auto webhook registration on bot create (`https://...`) |
| `OPENAI_API_KEY`           | runtime                | API key for AI prompt nodes                                                         |
| `OPENAI_BASE_URL`          | runtime                | OpenAI-compatible endpoint (default: `https://api.openai.com`)                      |
| `VITE_API_URL`             | web                    | Control-plane URL (default: `http://localhost:3001`)                                |

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Start all dev servers

```bash
pnpm dev
```

| Service                  | URL                   |
| ------------------------ | --------------------- |
| Web UI                   | http://localhost:5173 |
| Control Plane API        | http://localhost:3001 |
| Runtime (webhook server) | http://localhost:3002 |
| Prometheus               | http://localhost:9090 |

To run a single app:

```bash
pnpm --filter @telegraph/control-plane dev
pnpm --filter @telegraph/runtime dev
pnpm --filter @telegraph/web dev
```

### 6. ngrok + Telegram webhook setup (HTTPS required)

Telegram requires an HTTPS webhook URL. For local development, use [ngrok](https://ngrok.com/) to expose the runtime:

```bash
# Expose runtime server on a public HTTPS URL
ngrok http 3002
```

Then choose one of these options:

1. **Auto-connect on bot creation (recommended)**  
   Set `DEFAULT_WEBHOOK_BASE_URL` in `apps/control-plane/.env` to your ngrok HTTPS URL.  
   New bots will auto-register to `<ngrok-url>/webhook/<botId>`.
2. **Per-bot webhook URL**  
   Enter the ngrok URL in the create-bot form (`Webhook Base URL`) and it will auto-register right after bot creation.
3. **Manual registration from Manage Bot**  
   Use the bot manage screen to register/remove webhooks anytime.

Quick API example for manual registration:

```bash
curl -X POST http://localhost:3001/api/bots/<botId>/webhook/register \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"webhookBaseUrl": "https://<your-subdomain>.ngrok-free.app"}'
```

---

## API Overview

All routes except auth require a `Bearer` JWT in the `Authorization` header.

### Auth

| Method | Path        | Description                                        |
| ------ | ----------- | -------------------------------------------------- |
| `POST` | `/register` | Create account (email, password, tenant name/slug) |
| `POST` | `/login`    | Login (email, password, tenant slug) → JWT         |
| `GET`  | `/me`       | Current user info                                  |

### Bots

| Method   | Path                            | Description                                                  |
| -------- | ------------------------------- | ------------------------------------------------------------ |
| `GET`    | `/bots`                         | List bots (paginated)                                        |
| `POST`   | `/bots`                         | Create bot (name, Telegram token, optional `webhookBaseUrl`) |
| `GET`    | `/bots/:botId`                  | Get bot details                                              |
| `PATCH`  | `/bots/:botId`                  | Update bot                                                   |
| `DELETE` | `/bots/:botId`                  | Delete bot                                                   |
| `POST`   | `/bots/:botId/webhook/register` | Register Telegram webhook                                    |
| `POST`   | `/bots/:botId/webhook/remove`   | Remove Telegram webhook                                      |
| `POST`   | `/bots/:botId/test-message`     | Send Telegram test message (`chatId`, `text`)                |

### Flows

| Method   | Path                                 | Description                    |
| -------- | ------------------------------------ | ------------------------------ |
| `GET`    | `/bots/:botId/flows`                 | List flows                     |
| `POST`   | `/bots/:botId/flows`                 | Create flow                    |
| `GET`    | `/bots/:botId/flows/:flowId`         | Get flow (includes graph JSON) |
| `PUT`    | `/bots/:botId/flows/:flowId`         | Save flow graph                |
| `DELETE` | `/bots/:botId/flows/:flowId`         | Delete flow                    |
| `POST`   | `/bots/:botId/flows/:flowId/publish` | Compile & deploy flow          |

---

## Database Schema

Managed with Drizzle ORM. Tables:

| Table             | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `tenants`         | Organizations / workspaces                         |
| `users`           | Users scoped to a tenant (email unique per tenant) |
| `bots`            | Telegram bots with encrypted tokens                |
| `flows`           | Flow graphs (JSON) linked to a bot                 |
| `published_plans` | Compiled execution plans (versioned)               |
| `raw_updates`     | Idempotent Telegram update storage                 |
| `webhook_configs` | Per-bot webhook URL and secret                     |

### Running Migrations

```bash
# Generate a migration after editing packages/db/src/schema.ts
pnpm --filter @telegraph/db exec drizzle-kit generate

# Apply migrations
pnpm db:migrate
```

---

## Hosting / Deployment

Each app has a production `Dockerfile` using multi-stage builds.

### Docker Images

```bash
# Build all images
docker build -f apps/control-plane/Dockerfile -t telegraph-control-plane .
docker build -f apps/runtime/Dockerfile        -t telegraph-runtime .
docker build -f apps/web/Dockerfile             -t telegraph-web .
```

| Image                     | Base             | Entrypoint                                  | Port |
| ------------------------- | ---------------- | ------------------------------------------- | ---- |
| `telegraph-control-plane` | `node:22-alpine` | `node apps/control-plane/dist/server.js`    | 3001 |
| `telegraph-runtime`       | `node:22-alpine` | `node apps/runtime/dist/server.js`          | 3002 |
| `telegraph-web`           | `nginx:alpine`   | nginx serving SPA + reverse-proxying `/api` | 80   |

### Production Requirements

- **PostgreSQL 16** — persistent storage for tenants, bots, flows, plans, updates.
- **Redis 7** — BullMQ job queues, session storage (24h TTL), plan cache.
- **Public URL** for the runtime — Telegram needs to deliver webhooks to `POST /webhook/:botId`.

### Deployment Options

**Docker Compose** (simplest): extend the existing `infra/docker-compose.yml` to include the three app services alongside Postgres and Redis.

**Container Platforms**: Deploy the three Docker images to any container platform (Railway, Fly.io, Render, AWS ECS, Google Cloud Run). Key considerations:

- The **web** container serves static files and proxies `/api` to the control-plane. In production you may prefer a CDN + separate API domain instead.
- The **runtime** must be reachable from Telegram's servers on a stable public URL.
- The **control-plane** and **runtime** both need `DATABASE_URL` and `REDIS_URL` connectivity.

**Kubernetes**: Use separate Deployments for each service. The runtime workers are CPU-bound — scale the runtime horizontally and let BullMQ distribute jobs. Session locking (Redis distributed locks) ensures correctness under concurrent execution.

### Nginx Configuration

The web app ships with an `nginx.conf` that:

- Serves the SPA with `try_files $uri $uri/ /index.html` fallback for client-side routing.
- Proxies `/api` to `http://control-plane:3001` (assumes Docker service discovery; update the upstream for your setup).

---

## Testing

Tests are co-located with source files (`*.test.ts`) and run with Vitest.

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @telegraph/flow-compiler test
pnpm --filter @telegraph/shared test
```

---

## Scripts Reference

| Command           | Description                                       |
| ----------------- | ------------------------------------------------- |
| `pnpm install`    | Install all workspace dependencies                |
| `pnpm dev`        | Start all dev servers (Turborepo)                 |
| `pnpm build`      | Build all packages and apps                       |
| `pnpm typecheck`  | Type-check the entire monorepo                    |
| `pnpm lint`       | Lint all packages                                 |
| `pnpm format`     | Format with Prettier                              |
| `pnpm test`       | Run all tests                                     |
| `pnpm infra:up`   | Start Postgres, Redis, OTEL Collector, Prometheus |
| `pnpm infra:down` | Tear down infrastructure + volumes                |
| `pnpm db:migrate` | Run database migrations                           |

---

## License

<!-- TODO: Add license -->
