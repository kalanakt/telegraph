import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "member"]);
export const botStatusEnum = pgEnum("bot_status", [
  "active",
  "paused",
  "deleted",
]);

// tenants table
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

// bots table
export const bots = pgTable(
  "bots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    username: text("username"),
    encryptedToken: text("encrypted_token").notNull(),
    tokenIv: text("token_iv").notNull(),
    tokenTag: text("token_tag").notNull(),
    webhookSecret: text("webhook_secret").notNull(),
    status: botStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("bots_tenant_id_idx").on(t.tenantId)],
);

// flows table
export const flows = pgTable(
  "flows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    description: text("description"),
    graphJson: jsonb("graph_json"),
    isPublished: boolean("is_published").notNull().default(false),
    version: integer("version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("flows_bot_id_idx").on(t.botId),
    index("flows_tenant_id_idx").on(t.tenantId),
  ],
);

// published_plans table
export const publishedPlans = pgTable(
  "published_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    flowId: uuid("flow_id")
      .notNull()
      .references(() => flows.id),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    planJson: jsonb("plan_json").notNull(),
    callbackMapJson: jsonb("callback_map_json").notNull(),
    version: integer("version").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("published_plans_bot_id_idx").on(t.botId)],
);

// raw_updates table (for idempotent webhook processing)
export const rawUpdates = pgTable(
  "raw_updates",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    botId: uuid("bot_id")
      .notNull()
      .references(() => bots.id),
    telegramUpdateId: bigint("telegram_update_id", {
      mode: "bigint",
    }).notNull(),
    updateJson: jsonb("update_json").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("raw_updates_bot_update_idx").on(t.botId, t.telegramUpdateId),
  ],
);

// webhook_configs table
export const webhookConfigs = pgTable("webhook_configs", {
  botId: uuid("bot_id")
    .primaryKey()
    .references(() => bots.id),
  secretToken: text("secret_token").notNull(),
  url: text("url").notNull(),
  isActive: boolean("is_active").notNull().default(false),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  bots: many(bots),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export const botsRelations = relations(bots, ({ one, many }) => ({
  tenant: one(tenants, { fields: [bots.tenantId], references: [tenants.id] }),
  flows: many(flows),
  rawUpdates: many(rawUpdates),
}));

export const flowsRelations = relations(flows, ({ one, many }) => ({
  bot: one(bots, { fields: [flows.botId], references: [bots.id] }),
  tenant: one(tenants, { fields: [flows.tenantId], references: [tenants.id] }),
  publishedPlans: many(publishedPlans),
}));

export const publishedPlansRelations = relations(publishedPlans, ({ one }) => ({
  flow: one(flows, { fields: [publishedPlans.flowId], references: [flows.id] }),
  bot: one(bots, { fields: [publishedPlans.botId], references: [bots.id] }),
  tenant: one(tenants, {
    fields: [publishedPlans.tenantId],
    references: [tenants.id],
  }),
}));

export const rawUpdatesRelations = relations(rawUpdates, ({ one }) => ({
  bot: one(bots, { fields: [rawUpdates.botId], references: [bots.id] }),
}));

export const webhookConfigsRelations = relations(webhookConfigs, ({ one }) => ({
  bot: one(bots, { fields: [webhookConfigs.botId], references: [bots.id] }),
}));
