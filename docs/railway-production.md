# Railway Production Runbook

This runbook assumes two Railway services:

- `web`: Next.js dashboard, API routes, Telegram webhook receiver
- `worker`: BullMQ action processor and retention sweeper

## Release order

1. Set all shared and service-specific environment variables.
2. Run database migrations once:

```bash
pnpm railway:migrate
```

3. Deploy the `web` service.
4. Deploy the `worker` service.
5. Check:
   - `GET /api/health`
   - `GET /api/ready`
   - one real Telegram webhook delivery
   - worker logs for `worker_ready`

## Shared environment variables

Set these on both Railway services:

- `DATABASE_URL`
- `REDIS_URL`
- `ENCRYPTION_KEY`
- `SENTRY_DSN` (when Sentry is enabled)
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_ENVIRONMENT`
- `TELEGRAM_WEBHOOK_SECRET_TOKEN`

## Web service environment variables

Required on `web`:

- `NEXT_PUBLIC_SITE_URL`
- `TELEGRAM_WEBHOOK_BASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_PRO_PRODUCT_ID`

Optional on `web`:

- `CREEM_PRO_MONTHLY_PRODUCT_ID`
- `CREEM_PRO_YEARLY_PRODUCT_ID`
- `CREEM_TEST_MODE`
- `OPERATOR_EMAILS`
- `ENABLE_MEDIA_UPLOADS`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_URL`
- `ENABLE_CONTENTSQUARE`
- `CONTENTSQUARE_SITE_ID`

Notes:

- Set `ENABLE_MEDIA_UPLOADS=true` only when all S3 values are present.
- Set `ENABLE_CONTENTSQUARE=true` only when you want consent-gated analytics in production.

## Worker service environment variables

Required on `worker`:

- `WORKER_CONCURRENCY`

Optional on `worker`:

- `INCOMING_EVENT_RETENTION_DAYS`
- `DEAD_LETTER_RETENTION_DAYS`
- `WORKFLOW_RUN_RETENTION_DAYS`
- `ACTION_RUN_RETENTION_DAYS`
- `RETENTION_SWEEP_INTERVAL_MINUTES`

Defaults:

- `WORKER_CONCURRENCY=5`
- `INCOMING_EVENT_RETENTION_DAYS=30`
- `DEAD_LETTER_RETENTION_DAYS=30`
- `WORKFLOW_RUN_RETENTION_DAYS=180`
- `ACTION_RUN_RETENTION_DAYS=180`
- `RETENTION_SWEEP_INTERVAL_MINUTES=360`

## Existing production databases without migration history

This repo now includes an initial Prisma migration. If the target Railway database already has the schema and live data:

1. Back up the database first.
2. Baseline the existing schema by marking the initial migration as applied instead of replaying it:

```bash
pnpm exec prisma migrate resolve --applied <initial_migration_name>
```

3. Run `pnpm railway:migrate` after the baseline is recorded.

Do not reset a live database just to create migration history.

## Operational checks

- `GET /api/ready` should return `200`.
- `GET /api/ops/dead-letters` should only be accessible to emails listed in `OPERATOR_EMAILS`.
- Watch for dead-letter queue growth in logs and through the operator endpoint.
- Confirm Telegram webhook requests include the secret token header and return `200`.
