-- 0001_initial.sql
-- Initial schema for Telegraph

-- Enums
DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "bot_status" AS ENUM ('active', 'paused', 'deleted');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- tenants
CREATE TABLE IF NOT EXISTS "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- users
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'member',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_tenant_email_idx" ON "users" ("tenant_id", "email");

-- bots
CREATE TABLE IF NOT EXISTS "bots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "name" text NOT NULL,
  "username" text,
  "encrypted_token" text NOT NULL,
  "token_iv" text NOT NULL,
  "token_tag" text NOT NULL,
  "webhook_secret" text NOT NULL,
  "status" "bot_status" NOT NULL DEFAULT 'active',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "bots_tenant_id_idx" ON "bots" ("tenant_id");

-- flows
CREATE TABLE IF NOT EXISTS "flows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bot_id" uuid NOT NULL REFERENCES "bots"("id"),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "name" text NOT NULL,
  "description" text,
  "graph_json" jsonb,
  "is_published" boolean NOT NULL DEFAULT false,
  "version" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "flows_bot_id_idx" ON "flows" ("bot_id");
CREATE INDEX IF NOT EXISTS "flows_tenant_id_idx" ON "flows" ("tenant_id");

-- published_plans
CREATE TABLE IF NOT EXISTS "published_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "flow_id" uuid NOT NULL REFERENCES "flows"("id"),
  "bot_id" uuid NOT NULL REFERENCES "bots"("id"),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id"),
  "plan_json" jsonb NOT NULL,
  "callback_map_json" jsonb NOT NULL,
  "version" integer NOT NULL,
  "published_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "published_plans_bot_id_idx" ON "published_plans" ("bot_id");

-- raw_updates (for idempotent webhook processing)
CREATE TABLE IF NOT EXISTS "raw_updates" (
  "id" bigserial PRIMARY KEY,
  "bot_id" uuid NOT NULL REFERENCES "bots"("id"),
  "telegram_update_id" bigint NOT NULL,
  "update_json" jsonb NOT NULL,
  "received_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "raw_updates_bot_update_idx" ON "raw_updates" ("bot_id", "telegram_update_id");

-- webhook_configs
CREATE TABLE IF NOT EXISTS "webhook_configs" (
  "bot_id" uuid PRIMARY KEY REFERENCES "bots"("id"),
  "secret_token" text NOT NULL,
  "url" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT false
);
