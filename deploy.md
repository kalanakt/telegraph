# Railway Deployment Plan

This repo is now prepared for Railway with two app services:

- `web` (Next.js app)
- `worker` (BullMQ processor)

and two managed data services:

- `Postgres`
- `Redis`

## 1. Preflight

Run these in the repo root:

```bash
command -v railway
railway whoami --json
railway --version
railway status --json
```

If this folder is not linked yet, link or initialize:

```bash
railway project list --json
railway link --project <project-id-or-name>
```

or create a new project:

```bash
railway init --name telegraph-dev
```

## 2. Create Services

```bash
railway add --service web
railway add --service worker
railway add --database postgres
railway add --database redis
```

## 3. Configure Build/Start Commands (Monorepo-safe)

These commands keep full repo context so workspace imports continue to work.

```bash
railway environment edit --service-config web build.buildCommand "pnpm railway:build:web"
railway environment edit --service-config web deploy.startCommand "pnpm railway:start:web"
railway environment edit --service-config web build.watchPatterns '["apps/web/**","packages/shared/**","prisma/**","package.json","pnpm-lock.yaml","pnpm-workspace.yaml"]'
railway environment edit --service-config web deploy.healthcheckPath "/"

railway environment edit --service-config worker build.buildCommand "pnpm railway:build:worker"
railway environment edit --service-config worker deploy.startCommand "pnpm railway:start:worker"
railway environment edit --service-config worker build.watchPatterns '["apps/worker/**","packages/shared/**","prisma/**","package.json","pnpm-lock.yaml","pnpm-workspace.yaml"]'
```

## 4. Wire Environment Variables

Set shared/app variables:

```bash
railway variable set \
  DATABASE_URL='${{Postgres.DATABASE_URL}}' \
  REDIS_URL='${{Redis.REDIS_URL}}' \
  ENCRYPTION_KEY='<32+ char secret>' \
  TELEGRAM_WEBHOOK_BASE_URL='https://<your-web-domain>/api/telegram/webhook' \
  NEXT_PUBLIC_SITE_URL='https://<your-web-domain>' \
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='<clerk-pk>' \
  CLERK_SECRET_KEY='<clerk-sk>' \
  --service web
```

Set worker variables:

```bash
railway variable set \
  DATABASE_URL='${{Postgres.DATABASE_URL}}' \
  REDIS_URL='${{Redis.REDIS_URL}}' \
  --service worker
```

Optional billing/webhook vars (web service):

```bash
railway variable set \
  CLERK_WEBHOOK_SIGNING_SECRET='<optional>' \
  CLERK_BILLING_PRO_PLAN_SLUGS='pro' \
  --service web
```

## 5. Deploy

```bash
railway up --service web --detach -m "deploy web"
railway up --service worker --detach -m "deploy worker"
```

Watch status/logs:

```bash
railway deployment list --service web --limit 10 --json
railway deployment list --service worker --limit 10 --json
railway logs --service web --lines 200 --json
railway logs --service worker --lines 200 --json
```

## 6. Verify

- Open the web domain and verify `/`, `/pricing`, `/blog`, and authenticated pages.
- Confirm worker log shows `Action worker is ready`.
- Trigger a Telegram event and verify:
  - webhook route receives update
  - workflow/action runs are created
  - action job is processed by worker

## 7. Rollback / Recovery

```bash
railway redeploy --service web --yes
railway redeploy --service worker --yes
railway restart --service web --yes
railway restart --service worker --yes
```

If needed, remove only latest deployment (service remains):

```bash
railway down --service web --yes
railway down --service worker --yes
```
