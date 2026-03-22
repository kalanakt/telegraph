import { and, desc, eq } from "drizzle-orm";

import type { Database } from "@telegraph/db/client";
import { bots, flows, webhookConfigs } from "@telegraph/db/schema";
import {
  decryptBotToken,
  encryptBotToken,
  generateId,
  telegramApiUrl,
} from "@telegraph/shared";

interface CreateBotInput {
  name: string;
  token: string;
}

interface UpdateBotInput {
  name?: string;
}

interface SendTestMessageInput {
  chatId: string | number;
  text: string;
}

interface TelegramGetMePayload {
  ok?: boolean;
  description?: string;
  result?: {
    username?: string;
  };
}

interface TelegramMethodPayload {
  ok?: boolean;
  description?: string;
  result?: Record<string, unknown>;
}

function parseTelegramErrorDescription(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const description = (payload as Record<string, unknown>)["description"];
  if (typeof description !== "string" || !description.trim()) return null;
  return description.trim();
}

async function parseTelegramPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

function ensureTelegramCallSucceeded(
  response: Response,
  payload: TelegramMethodPayload | unknown,
  fallbackMessage: string,
): void {
  const description = parseTelegramErrorDescription(payload);
  if (
    response.ok &&
    (payload as TelegramMethodPayload | undefined)?.ok === true
  ) {
    return;
  }

  throw Object.assign(new Error(description ?? fallbackMessage), {
    statusCode: 400,
  });
}

function normalizeChatId(chatId: string | number): string | number {
  if (typeof chatId === "number") {
    if (!Number.isInteger(chatId)) {
      throw Object.assign(new Error("Chat ID must be an integer"), {
        statusCode: 400,
      });
    }
    return chatId;
  }

  const clean = chatId.trim();
  if (!clean) {
    throw Object.assign(new Error("Chat ID is required"), {
      statusCode: 400,
    });
  }

  if (/^-?\d+$/.test(clean)) {
    return Number.parseInt(clean, 10);
  }

  return clean;
}

export async function fetchTelegramBotIdentity(
  token: string,
): Promise<{ username: string | null }> {
  let response: Response;
  try {
    response = await fetch(telegramApiUrl(token, "getMe"));
  } catch {
    throw Object.assign(new Error("Telegram API is unreachable"), {
      statusCode: 502,
    });
  }

  let payload: TelegramGetMePayload | undefined;
  try {
    payload = (await response.json()) as TelegramGetMePayload;
  } catch {
    throw Object.assign(new Error("Unexpected response from Telegram API"), {
      statusCode: 502,
    });
  }

  if (!response.ok || payload.ok !== true) {
    throw Object.assign(new Error("Invalid Telegram bot token"), {
      statusCode: 400,
    });
  }

  return { username: payload.result?.username ?? null };
}

export async function listBots(
  db: Database,
  tenantId: string,
  limit = 50,
  offset = 0,
) {
  return db
    .select({
      id: bots.id,
      name: bots.name,
      username: bots.username,
      status: bots.status,
      tenantId: bots.tenantId,
      createdAt: bots.createdAt,
      updatedAt: bots.updatedAt,
    })
    .from(bots)
    .where(and(eq(bots.tenantId, tenantId), eq(bots.status, "active")))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(bots.createdAt));
}

export async function createBot(
  db: Database,
  tenantId: string,
  input: CreateBotInput,
  masterKey: string,
) {
  const identity = await fetchTelegramBotIdentity(input.token);
  const encrypted = encryptBotToken(input.token, masterKey);
  const webhookSecret = generateId();

  const bot = await db.transaction(async (tx) => {
    const [createdBot] = await tx
      .insert(bots)
      .values({
        tenantId,
        name: input.name,
        username: identity.username,
        encryptedToken: encrypted.ciphertext,
        tokenIv: encrypted.iv,
        tokenTag: encrypted.tag,
        webhookSecret,
      })
      .returning();

    if (!createdBot) {
      throw new Error("Failed to create bot");
    }

    await tx.insert(flows).values({
      botId: createdBot.id,
      tenantId,
      name: "Main",
      description: "Default flow",
      graphJson: null,
    });

    return createdBot;
  });

  return {
    id: bot.id,
    name: bot.name,
    username: bot.username,
    status: bot.status,
    tenantId: bot.tenantId,
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
      tenantId: bots.tenantId,
      createdAt: bots.createdAt,
      updatedAt: bots.updatedAt,
    })
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .limit(1);

  return bot ?? null;
}

export async function updateBot(
  db: Database,
  tenantId: string,
  botId: string,
  input: UpdateBotInput,
) {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) values["name"] = input.name;

  const [bot] = await db
    .update(bots)
    .set(values)
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .returning();

  if (!bot) {
    throw Object.assign(new Error("Bot not found"), { statusCode: 404 });
  }

  return {
    id: bot.id,
    name: bot.name,
    username: bot.username,
    status: bot.status,
    tenantId: bot.tenantId,
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
  };
}

export async function deleteBot(db: Database, tenantId: string, botId: string) {
  const [bot] = await db
    .update(bots)
    .set({ status: "deleted", updatedAt: new Date() })
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .returning();

  if (!bot) {
    throw Object.assign(new Error("Bot not found"), { statusCode: 404 });
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
    throw Object.assign(new Error("Bot not found"), { statusCode: 404 });
  }

  const token = decryptBotToken(
    bot.encryptedToken,
    bot.tokenIv,
    bot.tokenTag,
    masterKey,
  );
  const normalizedBaseUrl = webhookBaseUrl.replace(/\/+$/, "");
  const webhookUrl = `${normalizedBaseUrl}/webhook/${botId}`;

  const response = await fetch(telegramApiUrl(token, "setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: bot.webhookSecret,
    }),
  });

  const payload = (await parseTelegramPayload(
    response,
  )) as TelegramMethodPayload;
  ensureTelegramCallSucceeded(
    response,
    payload,
    "Telegram rejected webhook registration",
  );

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

export async function removeWebhook(
  db: Database,
  tenantId: string,
  botId: string,
  masterKey: string,
) {
  const [bot] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .limit(1);

  if (!bot) {
    throw Object.assign(new Error("Bot not found"), { statusCode: 404 });
  }

  const token = decryptBotToken(
    bot.encryptedToken,
    bot.tokenIv,
    bot.tokenTag,
    masterKey,
  );

  const response = await fetch(telegramApiUrl(token, "deleteWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const payload = (await parseTelegramPayload(
    response,
  )) as TelegramMethodPayload;
  ensureTelegramCallSucceeded(
    response,
    payload,
    "Telegram rejected webhook removal",
  );

  await db
    .update(webhookConfigs)
    .set({ isActive: false })
    .where(eq(webhookConfigs.botId, botId));
}

export async function sendTestMessage(
  db: Database,
  tenantId: string,
  botId: string,
  masterKey: string,
  input: SendTestMessageInput,
) {
  const [bot] = await db
    .select()
    .from(bots)
    .where(and(eq(bots.id, botId), eq(bots.tenantId, tenantId)))
    .limit(1);

  if (!bot) {
    throw Object.assign(new Error("Bot not found"), { statusCode: 404 });
  }

  const token = decryptBotToken(
    bot.encryptedToken,
    bot.tokenIv,
    bot.tokenTag,
    masterKey,
  );
  const chatId = normalizeChatId(input.chatId);

  const response = await fetch(telegramApiUrl(token, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: input.text,
    }),
  });

  const payload = (await parseTelegramPayload(
    response,
  )) as TelegramMethodPayload;
  ensureTelegramCallSucceeded(
    response,
    payload,
    "Telegram rejected test message",
  );

  return {
    ok: true,
    messageId: Number(payload.result?.["message_id"] ?? 0),
  };
}
