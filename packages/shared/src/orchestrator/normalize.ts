import type { TelegramUpdate } from "../types/telegram.js";
import type { JsonValue, NormalizedEvent } from "../types/workflow.js";

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

function mapMessageSource(chatType?: string): "user" | "channel" | "group" {
  if (chatType === "channel") {
    return "channel";
  }

  if ((chatType ?? "").includes("group")) {
    return "group";
  }

  return "user";
}

function extractMessageFeatures(message: unknown): Partial<Pick<NormalizedEvent, "hasPhoto" | "hasVideo" | "hasDocument" | "hasSticker" | "hasLocation" | "hasContact">> {
  if (!message || typeof message !== "object") {
    return {};
  }

  const msg = message as Record<string, unknown>;
  const features = {
    hasPhoto: Array.isArray(msg.photo) && msg.photo.length > 0,
    hasVideo: typeof msg.video === "object" && msg.video !== null,
    hasDocument: typeof msg.document === "object" && msg.document !== null,
    hasSticker: typeof msg.sticker === "object" && msg.sticker !== null,
    hasLocation: typeof msg.location === "object" && msg.location !== null,
    hasContact: typeof msg.contact === "object" && msg.contact !== null
  };

  const enabled: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(features)) {
    if (value) {
      enabled[key] = true;
    }
  }

  return enabled as unknown as Partial<
    Pick<NormalizedEvent, "hasPhoto" | "hasVideo" | "hasDocument" | "hasSticker" | "hasLocation" | "hasContact">
  >;
}

function extractMessageCommerceFields(
  message: unknown
): Partial<
  Pick<
    NormalizedEvent,
    | "contactPhoneNumber"
    | "contactUserId"
    | "invoicePayload"
    | "currency"
    | "totalAmount"
    | "successfulPaymentChargeId"
    | "successfulPaymentProviderChargeId"
    | "shippingOptionId"
    | "orderInfo"
  >
> {
  if (!message || typeof message !== "object") {
    return {};
  }

  const msg = message as Record<string, unknown>;
  const contact = typeof msg.contact === "object" && msg.contact !== null ? (msg.contact as Record<string, unknown>) : null;
  const payment =
    typeof msg.successful_payment === "object" && msg.successful_payment !== null
      ? (msg.successful_payment as Record<string, unknown>)
      : null;

  return {
    contactPhoneNumber: typeof contact?.phone_number === "string" ? contact.phone_number : undefined,
    contactUserId: typeof contact?.user_id === "number" ? contact.user_id : undefined,
    invoicePayload: typeof payment?.invoice_payload === "string" ? payment.invoice_payload : undefined,
    currency: typeof payment?.currency === "string" ? payment.currency : undefined,
    totalAmount: typeof payment?.total_amount === "number" ? payment.total_amount : undefined,
    successfulPaymentChargeId: typeof payment?.telegram_payment_charge_id === "string" ? payment.telegram_payment_charge_id : undefined,
    successfulPaymentProviderChargeId:
      typeof payment?.provider_payment_charge_id === "string" ? payment.provider_payment_charge_id : undefined,
    shippingOptionId: typeof payment?.shipping_option_id === "string" ? payment.shipping_option_id : undefined,
    orderInfo: typeof payment?.order_info === "object" && payment.order_info !== null ? (payment.order_info as JsonValue) : undefined
  };
}

export function normalizeTelegramUpdate(update: TelegramUpdate): NormalizedEvent {
  const messageSource = update.message;
  if (messageSource) {
    const text = messageSource.text ?? messageSource.caption ?? "";
    const command = extractCommand(text);
    if (command) {
      return {
        source: "telegram",
        trigger: "command_received",
        eventId: String(update.update_id),
        updateId: update.update_id,
        messageId: messageSource.message_id,
        chatId: String(messageSource.chat.id),
        chatType: messageSource.chat.type,
        fromUserId: messageSource.from?.id,
        fromUsername: messageSource.from?.username,
        messageSource: mapMessageSource(messageSource.chat.type),
        text,
        command: command.command,
        commandArgs: command.commandArgs,
        ...extractMessageFeatures(messageSource),
        ...extractMessageCommerceFields(messageSource),
        variables: {}
      };
    }

    return {
      source: "telegram",
      trigger: "message_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      messageId: messageSource.message_id,
      chatId: String(messageSource.chat.id),
      chatType: messageSource.chat.type,
      fromUserId: messageSource.from?.id,
      fromUsername: messageSource.from?.username,
      messageSource: mapMessageSource(messageSource.chat.type),
      text,
      ...extractMessageFeatures(messageSource),
      ...extractMessageCommerceFields(messageSource),
      variables: {}
    };
  }

  const editedMessage = update.edited_message;
  if (editedMessage) {
    return {
      source: "telegram",
      trigger: "message_edited",
      eventId: String(update.update_id),
      updateId: update.update_id,
      messageId: editedMessage.message_id,
      chatId: String(editedMessage.chat.id),
      chatType: editedMessage.chat.type,
      fromUserId: editedMessage.from?.id,
      fromUsername: editedMessage.from?.username,
      messageSource: mapMessageSource(editedMessage.chat.type),
      text: editedMessage.text ?? editedMessage.caption ?? "",
      ...extractMessageFeatures(editedMessage),
      variables: {}
    };
  }

  if (update.channel_post) {
    return {
      source: "telegram",
      trigger: "channel_post_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      messageId: update.channel_post.message_id,
      chatId: String(update.channel_post.chat.id),
      chatType: update.channel_post.chat.type,
      messageSource: "channel",
      text: update.channel_post.text ?? update.channel_post.caption ?? "",
      ...extractMessageFeatures(update.channel_post),
      variables: {}
    };
  }

  if (update.edited_channel_post) {
    return {
      source: "telegram",
      trigger: "channel_post_edited",
      eventId: String(update.update_id),
      updateId: update.update_id,
      messageId: update.edited_channel_post.message_id,
      chatId: String(update.edited_channel_post.chat.id),
      chatType: update.edited_channel_post.chat.type,
      messageSource: "channel",
      text: update.edited_channel_post.text ?? update.edited_channel_post.caption ?? "",
      ...extractMessageFeatures(update.edited_channel_post),
      variables: {}
    };
  }

  if (update.callback_query) {
    const cb = update.callback_query;
    return {
      source: "telegram",
      trigger: "callback_query_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      callbackQueryId: cb.id,
      chatId: cb.message?.chat ? String(cb.message.chat.id) : undefined,
      chatType: cb.message?.chat?.type,
      messageId: cb.message?.message_id,
      fromUserId: cb.from?.id,
      fromUsername: cb.from?.username,
      messageSource: mapMessageSource(cb.message?.chat?.type),
      text: cb.data ?? "",
      callbackData: cb.data,
      callbackSourceMessageId: cb.message?.message_id,
      callbackSourceChatId: cb.message?.chat ? String(cb.message.chat.id) : undefined,
      ...(cb.message ? extractMessageFeatures(cb.message) : {}),
      ...(cb.message ? extractMessageCommerceFields(cb.message) : {}),
      variables: {}
    };
  }

  if (update.inline_query) {
    return {
      source: "telegram",
      trigger: "inline_query_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      inlineQueryId: update.inline_query.id,
      inlineQuery: update.inline_query.query,
      fromUserId: update.inline_query.from.id,
      fromUsername: update.inline_query.from.username,
      messageSource: "user",
      text: update.inline_query.query,
      variables: {}
    };
  }

  if (update.chosen_inline_result) {
    return {
      source: "telegram",
      trigger: "chosen_inline_result_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      fromUserId: update.chosen_inline_result.from.id,
      fromUsername: update.chosen_inline_result.from.username,
      messageSource: "user",
      text: update.chosen_inline_result.query,
      variables: {}
    };
  }

  if (update.shipping_query) {
    return {
      source: "telegram",
      trigger: "shipping_query_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      shippingQueryId: update.shipping_query.id,
      invoicePayload: update.shipping_query.invoice_payload,
      shippingAddress: update.shipping_query.shipping_address as JsonValue | undefined,
      fromUserId: update.shipping_query.from.id,
      fromUsername: update.shipping_query.from.username,
      messageSource: "user",
      text: "",
      variables: {}
    };
  }

  if (update.pre_checkout_query) {
    return {
      source: "telegram",
      trigger: "pre_checkout_query_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      preCheckoutQueryId: update.pre_checkout_query.id,
      invoicePayload: update.pre_checkout_query.invoice_payload,
      currency: update.pre_checkout_query.currency,
      totalAmount: update.pre_checkout_query.total_amount,
      shippingOptionId: update.pre_checkout_query.shipping_option_id,
      orderInfo: update.pre_checkout_query.order_info as JsonValue | undefined,
      fromUserId: update.pre_checkout_query.from.id,
      fromUsername: update.pre_checkout_query.from.username,
      messageSource: "user",
      text: "",
      variables: {}
    };
  }

  if (update.poll) {
    return {
      source: "telegram",
      trigger: "poll_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      text: update.poll.question,
      variables: {}
    };
  }

  if (update.poll_answer) {
    return {
      source: "telegram",
      trigger: "poll_answer_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      pollId: update.poll_answer.poll_id,
      pollOptionIds: update.poll_answer.option_ids,
      fromUserId: update.poll_answer.user.id,
      fromUsername: update.poll_answer.user.username,
      messageSource: "user",
      text: "",
      variables: {}
    };
  }

  if (update.chat_member) {
    return {
      source: "telegram",
      trigger: "chat_member_updated",
      eventId: String(update.update_id),
      updateId: update.update_id,
      chatId: String(update.chat_member.chat.id),
      chatType: update.chat_member.chat.type,
      fromUserId: update.chat_member.from?.id,
      fromUsername: update.chat_member.from?.username,
      messageSource: mapMessageSource(update.chat_member.chat.type),
      text: "",
      targetUserId: update.chat_member.new_chat_member?.user.id,
      oldStatus: update.chat_member.old_chat_member?.status,
      newStatus: update.chat_member.new_chat_member?.status,
      variables: {}
    };
  }

  if (update.my_chat_member) {
    return {
      source: "telegram",
      trigger: "my_chat_member_updated",
      eventId: String(update.update_id),
      updateId: update.update_id,
      chatId: String(update.my_chat_member.chat.id),
      chatType: update.my_chat_member.chat.type,
      fromUserId: update.my_chat_member.from?.id,
      fromUsername: update.my_chat_member.from?.username,
      messageSource: mapMessageSource(update.my_chat_member.chat.type),
      text: "",
      targetUserId: update.my_chat_member.new_chat_member?.user.id,
      oldStatus: update.my_chat_member.old_chat_member?.status,
      newStatus: update.my_chat_member.new_chat_member?.status,
      variables: {}
    };
  }

  if (update.chat_join_request) {
    return {
      source: "telegram",
      trigger: "chat_join_request_received",
      eventId: String(update.update_id),
      updateId: update.update_id,
      chatId: String(update.chat_join_request.chat.id),
      chatType: update.chat_join_request.chat.type,
      fromUserId: update.chat_join_request.from.id,
      fromUsername: update.chat_join_request.from.username,
      joinRequestBio: update.chat_join_request.bio,
      joinRequestInviteLink: update.chat_join_request.invite_link?.name ?? update.chat_join_request.invite_link?.invite_link,
      messageSource: mapMessageSource(update.chat_join_request.chat.type),
      text: "",
      variables: {}
    };
  }

  if (update.message_reaction) {
    return {
      source: "telegram",
      trigger: "message_reaction_updated",
      eventId: String(update.update_id),
      updateId: update.update_id,
      chatId: String(update.message_reaction.chat.id),
      chatType: update.message_reaction.chat.type,
      fromUserId: update.message_reaction.user?.id,
      fromUsername: update.message_reaction.user?.username,
      messageSource: mapMessageSource(update.message_reaction.chat.type),
      text: "",
      messageId: update.message_reaction.message_id,
      oldReaction: update.message_reaction.old_reaction as JsonValue | undefined,
      newReaction: update.message_reaction.new_reaction as JsonValue | undefined,
      variables: {}
    };
  }

  if (update.message_reaction_count) {
    return {
      source: "telegram",
      trigger: "message_reaction_count_updated",
      eventId: String(update.update_id),
      updateId: update.update_id,
      chatId: String(update.message_reaction_count.chat.id),
      chatType: update.message_reaction_count.chat.type,
      messageSource: mapMessageSource(update.message_reaction_count.chat.type),
      text: "",
      messageId: update.message_reaction_count.message_id,
      reactionCount: update.message_reaction_count.reactions as JsonValue | undefined,
      variables: {}
    };
  }

  return {
    source: "telegram",
    trigger: "update_received",
    eventId: String(update.update_id),
    updateId: update.update_id,
    text: "",
    rawUpdate: update,
    variables: {}
  };
}
