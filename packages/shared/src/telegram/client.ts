import type { TelegramApiResult, TelegramMeResponse } from "../types/telegram.js";
import type { TelegramMethod, TelegramMethodParams, TelegramRequestResult } from "./types.js";

const TELEGRAM_API = "https://api.telegram.org";

export type { TelegramRequestResult } from "./types.js";

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return null;
  }
}

export async function requestTelegram(token: string, method: string, payload?: Record<string, unknown>): Promise<TelegramRequestResult> {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: payload ? "POST" : "GET",
    headers: payload
      ? {
          accept: "application/json",
          "content-type": "application/json"
        }
      : undefined,
    body: payload ? JSON.stringify(payload) : undefined
  });

  const bodyText = await response.text();
  const parsed = bodyText ? safeJsonParse(bodyText) : null;
  const json =
    parsed && typeof parsed === "object" && parsed !== null && "ok" in parsed ? (parsed as TelegramApiResult) : null;

  if (!response.ok) {
    return {
      ok: false,
      errorCode: (json?.error_code ?? response.status) || undefined,
      description: json?.description ?? response.statusText ?? "Telegram API request failed"
    };
  }

  if (!json) {
    return {
      ok: false,
      errorCode: response.status || undefined,
      description: "Telegram API response was not valid JSON"
    };
  }

  return {
    ok: Boolean(json.ok),
    errorCode: json.error_code,
    description: json.description,
    result: json.result
  };
}

export async function telegramInvokeMethod<M extends TelegramMethod>(
  token: string,
  method: M,
  params: TelegramMethodParams<M>
): Promise<TelegramRequestResult> {
  return requestTelegram(token, method, params as Record<string, unknown>);
}

export async function telegramGetMe(token: string): Promise<TelegramMeResponse> {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/getMe`);
  if (!response.ok) {
    return { ok: false };
  }
  return (await response.json()) as TelegramMeResponse;
}

export async function telegramSetWebhook(
  token: string,
  webhookUrl: string,
  options?: { secretToken?: string | null }
): Promise<boolean> {
  const secretToken = options?.secretToken ?? undefined;

  const result = await requestTelegram(token, "setWebhook", {
    url: webhookUrl,
    ...(secretToken ? { secret_token: secretToken } : {}),
    allowed_updates: [
      "message",
      "edited_message",
      "channel_post",
      "edited_channel_post",
      "callback_query",
      "inline_query",
      "chosen_inline_result",
      "shipping_query",
      "pre_checkout_query",
      "poll",
      "poll_answer",
      "chat_member",
      "my_chat_member",
      "chat_join_request",
      "message_reaction",
      "message_reaction_count"
    ]
  });

  return result.ok;
}
