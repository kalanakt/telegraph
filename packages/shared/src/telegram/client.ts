import type { TelegramApiResult, TelegramMeResponse } from "../types/telegram";

const TELEGRAM_API = "https://api.telegram.org";

type TelegramRequestResult = {
  ok: boolean;
  errorCode?: number;
  description?: string;
};

async function requestTelegram(token: string, method: string, payload?: Record<string, unknown>): Promise<TelegramRequestResult> {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: payload ? "POST" : "GET",
    headers: payload
      ? {
          "content-type": "application/json"
        }
      : undefined,
    body: payload ? JSON.stringify(payload) : undefined
  });

  if (!response.ok) {
    return {
      ok: false,
      errorCode: response.status,
      description: response.statusText
    };
  }

  const json = (await response.json()) as TelegramApiResult;
  return {
    ok: Boolean(json.ok),
    errorCode: json.error_code,
    description: json.description
  };
}

export async function telegramGetMe(token: string): Promise<TelegramMeResponse> {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/getMe`);
  if (!response.ok) {
    return { ok: false };
  }
  return (await response.json()) as TelegramMeResponse;
}

export async function telegramSetWebhook(token: string, webhookUrl: string): Promise<boolean> {
  const result = await requestTelegram(token, "setWebhook", {
    url: webhookUrl,
    allowed_updates: [
      "message",
      "edited_message",
      "channel_post",
      "edited_channel_post",
      "callback_query",
      "inline_query",
      "chat_member",
      "my_chat_member"
    ]
  });

  return result.ok;
}

export async function telegramSendMessage(token: string, chatId: string, text: string): Promise<TelegramRequestResult> {
  return requestTelegram(token, "sendMessage", { chat_id: chatId, text });
}

export async function telegramSendPhoto(
  token: string,
  chatId: string,
  photoUrl: string,
  caption?: string
): Promise<TelegramRequestResult> {
  return requestTelegram(token, "sendPhoto", {
    chat_id: chatId,
    photo: photoUrl,
    caption
  });
}

export async function telegramSendDocument(
  token: string,
  chatId: string,
  documentUrl: string,
  caption?: string
): Promise<TelegramRequestResult> {
  return requestTelegram(token, "sendDocument", {
    chat_id: chatId,
    document: documentUrl,
    caption
  });
}

export async function telegramEditMessageText(
  token: string,
  chatId: string,
  messageId: number,
  text: string
): Promise<TelegramRequestResult> {
  return requestTelegram(token, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text
  });
}

export async function telegramDeleteMessage(token: string, chatId: string, messageId: number): Promise<TelegramRequestResult> {
  return requestTelegram(token, "deleteMessage", {
    chat_id: chatId,
    message_id: messageId
  });
}

export async function telegramAnswerCallbackQuery(
  token: string,
  callbackQueryId: string,
  text?: string,
  showAlert?: boolean
): Promise<TelegramRequestResult> {
  return requestTelegram(token, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert
  });
}

export async function telegramRestrictChatMember(
  token: string,
  chatId: string,
  userId: number,
  untilDate?: number,
  canSendMessages = false
): Promise<TelegramRequestResult> {
  return requestTelegram(token, "restrictChatMember", {
    chat_id: chatId,
    user_id: userId,
    until_date: untilDate,
    permissions: {
      can_send_messages: canSendMessages
    }
  });
}

export async function telegramBanChatMember(
  token: string,
  chatId: string,
  userId: number,
  revokeMessages?: boolean
): Promise<TelegramRequestResult> {
  return requestTelegram(token, "banChatMember", {
    chat_id: chatId,
    user_id: userId,
    revoke_messages: revokeMessages
  });
}

export async function telegramUnbanChatMember(
  token: string,
  chatId: string,
  userId: number,
  onlyIfBanned?: boolean
): Promise<TelegramRequestResult> {
  return requestTelegram(token, "unbanChatMember", {
    chat_id: chatId,
    user_id: userId,
    only_if_banned: onlyIfBanned
  });
}

export type { TelegramRequestResult };
