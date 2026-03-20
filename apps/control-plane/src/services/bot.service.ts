import { and, eq } from 'drizzle-orm';

import type { Database } from '@telegraph/db/client';
import { bots, webhookConfigs } from '@telegraph/db/schema';
import { decryptBotToken, encryptBotToken, generateId, telegramApiUrl } from '@telegraph/shared';

interface CreateBotInput {
  name: string;
  token: string;
  username?: string;
}

interface UpdateBotInput {
  name?: string;
  username?: string;
}

export async function listBots(db: Database, tenantId: string) {
  return db
    .select({
      id: bots.id,
      name: bots.name,
      username: bots.username,
      status: bots.status,
      webhookSecret: bots.webhookSecret,
      createdAt: bots.createdAt,
      updatedAt: bots.updatedAt,
    })
    .from(bots)
    .where(and(eq(bots.tenantId, tenantId), eq(bots.status, 'active')));
}

export async function createBot(db: Database, tenantId: string, input: CreateBotInput, masterKey: string) {
  const encrypted = encryptBotToken(input.token, masterKey);
  const webhookSecret = generateId();

  const [bot] = await db
    .insert(bots)
    .values({
      tenantId,
      name: input.name,
      username: input.username ?? null,
      encryptedToken: encrypted.ciphertext,
      tokenIv: encrypted.iv,
      tokenTag: encrypted.tag,
      webhookSecret,
    })
    .returning();

  if (!bot) {
    throw new Error('Failed to create bot');
  }

  return {
    id: bot.id,
    name: bot.name,
    username: bot.username,
    status: bot.status,
    webhookSecret: bot.webhookSecret,
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
  };
}

export async function getBot(db: Database, tenantId: string, botId: string) {
  const [bot] = await db
    .select({
      id: bots.id,
      name: bots.name,
      username: bots.username,
      status: bots.status,
      webhookSecret: bots.webhookSecret,
      createdAt: bots.createdAt,
      updatedAt: bots.updatedAt,
    })
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .limit(1);

  return bot ?? null;
}

export async function updateBot(db: Database, tenantId: string, botId: string, input: UpdateBotInput) {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) values['name'] = input.name;
  if (input.username !== undefined) values['username'] = input.username;

  const [bot] = await db
    .update(bots)
    .set(values)
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .returning();

  if (!bot) {
    throw Object.assign(new Error('Bot not found'), { statusCode: 404 });
  }

  return {
    id: bot.id,
    name: bot.name,
    username: bot.username,
    status: bot.status,
    webhookSecret: bot.webhookSecret,
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
  };
}

export async function deleteBot(db: Database, tenantId: string, botId: string) {
  const [bot] = await db
    .update(bots)
    .set({ status: 'deleted', updatedAt: new Date() })
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .returning();

  if (!bot) {
    throw Object.assign(new Error('Bot not found'), { statusCode: 404 });
  }
}

export async function registerWebhook(
  db: Database,
  tenantId: string,
  botId: string,
  masterKey: string,
  webhookBaseUrl: string,
) {
  // Fetch full bot record for decryption
  const [bot] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .limit(1);

  if (!bot) {
    throw Object.assign(new Error('Bot not found'), { statusCode: 404 });
  }

  const token = decryptBotToken(bot.encryptedToken, bot.tokenIv, bot.tokenTag, masterKey);
  const webhookUrl = `${webhookBaseUrl}/webhook/${botId}`;

  const response = await fetch(telegramApiUrl(token, 'setWebhook'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: bot.webhookSecret,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram setWebhook failed: ${text}`);
  }

  // Upsert webhook config
  await db
    .insert(webhookConfigs)
    .values({
      botId: bot.id,
      secretToken: bot.webhookSecret,
      url: webhookUrl,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: webhookConfigs.botId,
      set: {
        secretToken: bot.webhookSecret,
        url: webhookUrl,
        isActive: true,
      },
    });

  return { webhookUrl };
}

export async function removeWebhook(db: Database, tenantId: string, botId: string, masterKey: string) {
  const [bot] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .limit(1);

  if (!bot) {
    throw Object.assign(new Error('Bot not found'), { statusCode: 404 });
  }

  const token = decryptBotToken(bot.encryptedToken, bot.tokenIv, bot.tokenTag, masterKey);

  const response = await fetch(telegramApiUrl(token, 'deleteWebhook'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Telegram deleteWebhook failed: ${text}`);
  }

  await db
    .update(webhookConfigs)
    .set({ isActive: false })
    .where(eq(webhookConfigs.botId, botId));
}
