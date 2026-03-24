import type { TelegramUpdate } from "../types/telegram";
import type { NormalizedEvent } from "../types/workflow";

function extractCommand(text: string): { command: string; commandArgs: string } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  const [head, ...rest] = trimmed.split(/\s+/);
  const command = (head ?? "").split("@")[0] ?? "";
  return {
    command,
    commandArgs: rest.join(" ")
  };
}

export function normalizeTelegramUpdate(update: TelegramUpdate): NormalizedEvent | null {
  const messageSource = update.message ?? update.channel_post;
  if (messageSource) {
    const sourceWithFrom = messageSource as { from?: { id?: number } };
    const fromUserId = typeof sourceWithFrom.from?.id === "number" ? sourceWithFrom.from.id : undefined;
    const fromUsername =
      typeof (sourceWithFrom.from as { username?: string } | undefined)?.username === "string"
        ? (sourceWithFrom.from as { username?: string }).username
        : undefined;
    const text = messageSource.text ?? messageSource.caption ?? "";
    const command = extractCommand(text);
    const messageSourceType = messageSource.chat.type === "channel" ? "channel" : messageSource.chat.type.includes("group") ? "group" : "user";

    if (command) {
      return {
        trigger: "command_received",
        updateId: update.update_id,
        messageId: messageSource.message_id,
        chatId: String(messageSource.chat.id),
        chatType: messageSource.chat.type,
        fromUserId,
        fromUsername,
        messageSource: messageSourceType,
        text,
        command: command.command,
        commandArgs: command.commandArgs,
        variables: {}
      };
    }

    return {
      trigger: "message_received",
      updateId: update.update_id,
      messageId: messageSource.message_id,
      chatId: String(messageSource.chat.id),
      chatType: messageSource.chat.type,
      fromUserId,
      fromUsername,
      messageSource: messageSourceType,
      text,
      variables: {}
    };
  }

  const editedSource = update.edited_message ?? update.edited_channel_post;
  if (editedSource) {
    const sourceWithFrom = editedSource as { from?: { id?: number } };
    const fromUserId = typeof sourceWithFrom.from?.id === "number" ? sourceWithFrom.from.id : undefined;
    const fromUsername =
      typeof (sourceWithFrom.from as { username?: string } | undefined)?.username === "string"
        ? (sourceWithFrom.from as { username?: string }).username
        : undefined;
    const messageSourceType = editedSource.chat.type === "channel" ? "channel" : editedSource.chat.type.includes("group") ? "group" : "user";

    return {
      trigger: "message_edited",
      updateId: update.update_id,
      messageId: editedSource.message_id,
      chatId: String(editedSource.chat.id),
      chatType: editedSource.chat.type,
      fromUserId,
      fromUsername,
      messageSource: messageSourceType,
      text: editedSource.text ?? editedSource.caption ?? "",
      variables: {}
    };
  }

  if (update.callback_query) {
    const cb = update.callback_query;
    return {
      trigger: "callback_query_received",
      updateId: update.update_id,
      callbackQueryId: cb.id,
      chatId: String(cb.message?.chat.id ?? 0),
      chatType: cb.message?.chat.type ?? "private",
      messageId: cb.message?.message_id,
      fromUserId: cb.from?.id,
      fromUsername: cb.from?.username,
      messageSource: cb.message?.chat.type === "channel" ? "channel" : cb.message?.chat.type?.includes("group") ? "group" : "user",
      text: cb.data ?? "",
      callbackData: cb.data,
      variables: {}
    };
  }

  if (update.inline_query) {
    const inline = update.inline_query;
    return {
      trigger: "inline_query_received",
      updateId: update.update_id,
      inlineQueryId: inline.id,
      chatId: String(inline.from.id),
      chatType: "private",
      fromUserId: inline.from.id,
      fromUsername: inline.from.username,
      messageSource: "user",
      text: inline.query,
      inlineQuery: inline.query,
      variables: {}
    };
  }

  const member = update.chat_member ?? update.my_chat_member;
  if (member) {
    return {
      trigger: "chat_member_updated",
      updateId: update.update_id,
      chatId: String(member.chat.id),
      chatType: member.chat.type,
      fromUserId: member.from?.id,
      fromUsername: member.from?.username,
      messageSource: member.chat.type === "channel" ? "channel" : member.chat.type.includes("group") ? "group" : "user",
      text: "",
      targetUserId: member.new_chat_member?.user.id,
      oldStatus: member.old_chat_member?.status,
      newStatus: member.new_chat_member?.status,
      variables: {}
    };
  }

  return null;
}
