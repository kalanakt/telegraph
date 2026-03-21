You are an experienced, pragmatic software engineering AI agent. Do not over-engineer a solution when a simple one is possible. Keep edits minimal. If you want an exception to ANY rule, you MUST stop and get permission first.

# Telegraph

Telegraph is a multi-tenant platform for building Telegram bots using a visual flow editor. Users design bot conversation flows in a React-based web UI, which are compiled into execution plans and run by a background worker runtime. The system handles webhook ingestion, session management, job queues, and observability.

## Technology Stack

- **Language:** TypeScript (ES2022 target, NodeNext modules, strict mode)
- **Monorepo:** pnpm 9.15 workspaces + Turborepo
- **Node:** ≥22
- **Backend:** Fastify 5 (control-plane API + runtime webhook server)
- **Frontend:** React 18, Vite 6, Tailwind CSS 4, React Flow (`@xyflow/react`), TanStack Query
- **Database:** PostgreSQL 16 via Drizzle ORM
- **Queue / Cache:** Redis 7 via ioredis + BullMQ
- **Telegram SDK:** grammY
- **Telemetry:** OpenTelemetry (traces + metrics), Prometheus, prom-client
- **Testing:** Vitest (workspace-level config)
- **Linting:** ESLint 9 (typescript-eslint + prettier integration)
- **Formatting:** Prettier (with `prettier-plugin-organize-imports`)

## Project Structure

```
apps/
  control-plane/   # Fastify API – auth, bot CRUD, flow management, publishing
  runtime/         # Webhook ingestion, BullMQ workers (update → execute → outbound → AI → payment)
  web/             # React SPA – dashboard, flow editor (React Flow)
packages/
  db/              # Drizzle schema, migrations, client
  schemas/         # Zod schemas for flow graphs, node types, execution plans
  flow-compiler/   # Compiles flow graphs into executable plans
  shared/          # Logger (pino), Redis client, BullMQ queues, crypto, rate-limiter, ID generation
  telemetry/       # OpenTelemetry SDK setup, metrics helpers
infra/             # docker-compose (Postgres, Redis, OTEL collector, Prometheus)
```

### Key Files

| File | Purpose |
|------|---------|
| `packages/db/src/schema.ts` | Drizzle table definitions (tenants, users, bots, flows, published_plans, raw_updates, webhook_configs) |
| `packages/db/drizzle.config.ts` | Drizzle Kit config for migration generation |
| `packages/schemas/src/flow-graph.ts` | Zod schema for the visual flow graph JSON |
| `packages/schemas/src/plan.ts` | Zod schema for compiled execution plans |
| `packages/flow-compiler/src/compiler.ts` | Graph → plan compiler logic |
| `apps/control-plane/src/app.ts` | Fastify app setup with plugins |
| `apps/runtime/src/workers/` | BullMQ worker implementations |
| `apps/web/src/pages/FlowEditor.tsx` | React Flow-based visual editor |
| `turbo.json` | Turborepo pipeline definitions |
| `eslint.config.js` | Flat ESLint config (root) |

## Essential Commands

All commands run from the **repo root** unless noted.

```bash
# Install dependencies
pnpm install

# Start infrastructure (Postgres, Redis, OTEL collector, Prometheus)
pnpm infra:up          # docker compose -f infra/docker-compose.yml up -d
pnpm infra:down        # tear down + remove volumes

# Run database migrations
pnpm db:migrate        # runs via @telegraph/db

# Build all packages and apps (respects dependency order)
pnpm build             # turbo build

# Type-check
pnpm typecheck         # turbo typecheck

# Lint
pnpm lint              # turbo lint

# Format
pnpm format            # prettier --write .

# Run all tests
pnpm test              # turbo test

# Dev servers (all apps in parallel via Turborepo)
pnpm dev               # turbo dev

# Dev server for a single app
pnpm --filter @telegraph/control-plane dev   # localhost:3001
pnpm --filter @telegraph/runtime dev         # localhost:3002
pnpm --filter @telegraph/web dev             # localhost:5173
```

## Development Setup

1. `pnpm install`
2. `pnpm infra:up`
3. Copy `.env.example` → `.env` in each app (`apps/control-plane`, `apps/runtime`, `apps/web`) and adjust secrets.
4. `pnpm db:migrate`
5. `pnpm dev`

## Patterns

### Monorepo Dependencies

Internal packages use `workspace:*` protocol. Turborepo `dependsOn: ["^build"]` ensures packages are built before dependent apps. Always import internal packages by their `@telegraph/*` name—never use relative paths across package boundaries.

### Fastify Plugins

The control-plane registers functionality as Fastify plugins (`src/plugins/`). Follow the existing pattern: export a `fastify-plugin`-wrapped async function. Register new plugins in `app.ts`.

### Database Migrations

1. Edit `packages/db/src/schema.ts`.
2. Generate a migration: `pnpm --filter @telegraph/db exec drizzle-kit generate`.
3. Apply: `pnpm db:migrate`.

Do **not** hand-edit generated SQL files unless fixing a migration bug.

### BullMQ Workers

Workers live in `apps/runtime/src/workers/`. Each file exports a BullMQ `Worker` instance. The pipeline is: **update → execute → outbound** (with AI and payment as side-workers). Follow the existing naming convention (`<name>.worker.ts`).

### Testing

Tests use Vitest and are co-located with source files (`*.test.ts`). Run a single package's tests with:

```bash
pnpm --filter @telegraph/shared test
```

### Environment Variables

Secrets are loaded from `.env` files per-app (not committed). Reference `.env.example` for required variables. Bot tokens are encrypted at rest using `BOT_TOKEN_MASTER_KEY`—never log or store plaintext tokens.

## Anti-Patterns

- **Do not** import across app boundaries (`apps/runtime` must not import from `apps/control-plane`). Shared code belongs in a `packages/*` package.
- **Do not** use `any` without good reason. The ESLint rule `@typescript-eslint/no-explicit-any` is disabled, but prefer proper types. Unused variables must be prefixed with `_` or removed.
- **Do not** commit `.env` files, `dist/` directories, or `node_modules/`.
- **Do not** bypass Turborepo caching by running `tsc` directly in CI—use `pnpm build` / `pnpm typecheck`.

## Code Style

- Prettier handles formatting; do not configure style rules in ESLint.
- Imports are auto-organized by `prettier-plugin-organize-imports`. Do not manually sort imports.
- Prefix unused function parameters with `_` (enforced by ESLint: `argsIgnorePattern: '^_'`).
- Use `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`—handle `undefined` from index access explicitly.

## Commit and Pull Request Guidelines

### Before Committing

1. `pnpm typecheck` — must pass with no errors.
2. `pnpm lint` — must pass with no errors.
3. `pnpm test` — must pass.
4. `pnpm format` — run to normalize formatting.

### Commit Messages

Use the conventional format: `type: message`

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `ci`, `perf`.

Scope is optional but encouraged for monorepo clarity: `feat(runtime): add payment worker`.

### Pull Requests

- Title follows the same `type: message` format.
- Description should include: what changed, why, and how to test.
- Reference related issues when applicable.
