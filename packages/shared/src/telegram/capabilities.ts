import { z } from "zod";

export const telegramParseModeSchema = z.enum(["Markdown", "MarkdownV2", "HTML"]);

const messageEntityTypeSchema = z.enum([
  "mention",
  "hashtag",
  "cashtag",
  "bot_command",
  "url",
  "email",
  "phone_number",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "spoiler",
  "blockquote",
  "expandable_blockquote",
  "code",
  "pre",
  "text_link",
  "text_mention",
  "custom_emoji"
]);

const inlineKeyboardButtonSchema = z
  .object({
    text: z.string().min(1).max(128),
    url: z.string().url().optional(),
    callback_data: z.string().max(64).optional(),
    web_app: z.object({ url: z.string().url() }).optional(),
    login_url: z
      .object({
        url: z.string().url(),
        forward_text: z.string().optional(),
        bot_username: z.string().optional(),
        request_write_access: z.boolean().optional()
      })
      .strict()
      .optional(),
    switch_inline_query: z.string().optional(),
    switch_inline_query_current_chat: z.string().optional(),
    switch_inline_query_chosen_chat: z
      .object({
        query: z.string().optional()
      })
      .strict()
      .optional(),
    callback_game: z.record(z.string(), z.unknown()).optional(),
    pay: z.boolean().optional()
  })
  .strict();

const keyboardButtonSchema = z
  .object({
    text: z.string().min(1).max(128),
    request_users: z.record(z.string(), z.unknown()).optional(),
    request_chat: z.record(z.string(), z.unknown()).optional(),
    request_contact: z.boolean().optional(),
    request_location: z.boolean().optional(),
    request_poll: z.record(z.string(), z.unknown()).optional(),
    web_app: z.object({ url: z.string().url() }).optional()
  })
  .strict();

const forceReplySchema = z
  .object({
    force_reply: z.boolean().default(true),
    input_field_placeholder: z.string().max(64).optional(),
    selective: z.boolean().optional()
  })
  .strict();

const messageEntitySchema = z
  .object({
    type: messageEntityTypeSchema,
    offset: z.number().int().min(0),
    length: z.number().int().min(1),
    url: z.string().url().optional(),
    user: z
      .object({
        id: z.number().int(),
        is_bot: z.boolean().optional(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        username: z.string().optional(),
        language_code: z.string().optional()
      })
      .strict()
      .optional(),
    language: z.string().optional(),
    custom_emoji_id: z.string().optional()
  })
  .strict();

const inlineKeyboardMarkupSchema = z
  .object({
    inline_keyboard: z.array(z.array(inlineKeyboardButtonSchema).min(1)).min(1)
  })
  .strict();

const replyKeyboardMarkupSchema = z
  .object({
    keyboard: z.array(z.array(keyboardButtonSchema).min(1)).min(1),
    is_persistent: z.boolean().optional(),
    resize_keyboard: z.boolean().optional(),
    one_time_keyboard: z.boolean().optional(),
    input_field_placeholder: z.string().max(64).optional(),
    selective: z.boolean().optional()
  })
  .strict();

const replyKeyboardRemoveSchema = z
  .object({
    remove_keyboard: z.boolean().default(true),
    selective: z.boolean().optional()
  })
  .strict();

export const telegramReplyMarkupSchema = z.union([
  inlineKeyboardMarkupSchema,
  replyKeyboardMarkupSchema,
  replyKeyboardRemoveSchema,
  forceReplySchema
]);

const templateTokenSchema = z.string().regex(/^\{\{\s*[a-zA-Z0-9_.]+\s*\}\}$/);
const numericStringSchema = z.string().regex(/^-?\d+$/);

const templateableIntSchema = z.union([z.number().int(), numericStringSchema.transform(Number), templateTokenSchema]);
const templateablePositiveIntSchema = z.union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(Number), templateTokenSchema]);

const chatIdSchema = z.union([z.string().min(1), z.number().int()]);

const sendMessageSchema = z
  .object({
    chat_id: chatIdSchema,
    text: z.string().min(1).max(4096),
    parse_mode: telegramParseModeSchema.optional(),
    entities: z.array(messageEntitySchema).max(100).optional(),
    disable_web_page_preview: z.boolean().optional(),
    disable_notification: z.boolean().optional(),
    protect_content: z.boolean().optional(),
    reply_to_message_id: z.number().int().positive().optional(),
    allow_sending_without_reply: z.boolean().optional(),
    message_thread_id: z.number().int().positive().optional(),
    reply_markup: telegramReplyMarkupSchema.optional()
  })
  .strict();

const sendPhotoSchema = z
  .object({
    chat_id: chatIdSchema,
    photo: z.string().min(1),
    caption: z.string().max(1024).optional(),
    parse_mode: telegramParseModeSchema.optional(),
    caption_entities: z.array(messageEntitySchema).max(100).optional(),
    has_spoiler: z.boolean().optional(),
    disable_notification: z.boolean().optional(),
    protect_content: z.boolean().optional(),
    reply_to_message_id: z.number().int().positive().optional(),
    allow_sending_without_reply: z.boolean().optional(),
    message_thread_id: z.number().int().positive().optional(),
    reply_markup: telegramReplyMarkupSchema.optional()
  })
  .strict();

const sendDocumentSchema = z
  .object({
    chat_id: chatIdSchema,
    document: z.string().min(1),
    thumbnail: z.string().optional(),
    caption: z.string().max(1024).optional(),
    parse_mode: telegramParseModeSchema.optional(),
    caption_entities: z.array(messageEntitySchema).max(100).optional(),
    disable_content_type_detection: z.boolean().optional(),
    disable_notification: z.boolean().optional(),
    protect_content: z.boolean().optional(),
    reply_to_message_id: z.number().int().positive().optional(),
    allow_sending_without_reply: z.boolean().optional(),
    message_thread_id: z.number().int().positive().optional(),
    reply_markup: telegramReplyMarkupSchema.optional()
  })
  .strict();

const sendVideoSchema = z
  .object({
    chat_id: chatIdSchema,
    video: z.string().min(1),
    duration: z.number().int().positive().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    thumbnail: z.string().optional(),
    caption: z.string().max(1024).optional(),
    parse_mode: telegramParseModeSchema.optional(),
    caption_entities: z.array(messageEntitySchema).max(100).optional(),
    supports_streaming: z.boolean().optional(),
    has_spoiler: z.boolean().optional(),
    disable_notification: z.boolean().optional(),
    protect_content: z.boolean().optional(),
    reply_to_message_id: z.number().int().positive().optional(),
    allow_sending_without_reply: z.boolean().optional(),
    message_thread_id: z.number().int().positive().optional(),
    reply_markup: telegramReplyMarkupSchema.optional()
  })
  .strict();

const editMessageTextSchema = z
  .object({
    chat_id: chatIdSchema.optional(),
    message_id: templateablePositiveIntSchema.optional(),
    inline_message_id: z.string().optional(),
    text: z.string().min(1).max(4096),
    parse_mode: telegramParseModeSchema.optional(),
    entities: z.array(messageEntitySchema).max(100).optional(),
    disable_web_page_preview: z.boolean().optional(),
    reply_markup: inlineKeyboardMarkupSchema.optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasInline = Boolean(value.inline_message_id);
    const hasChatPair = value.chat_id !== undefined && value.message_id !== undefined;
    if (!hasInline && !hasChatPair) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "editMessageText requires inline_message_id or chat_id + message_id"
      });
    }
  });

const deleteMessageSchema = z
  .object({
    chat_id: chatIdSchema,
    message_id: templateablePositiveIntSchema
  })
  .strict();

const answerCallbackQuerySchema = z
  .object({
    callback_query_id: z.string().min(1),
    text: z.string().max(200).optional(),
    show_alert: z.boolean().optional(),
    url: z.string().url().optional(),
    cache_time: z.number().int().min(0).max(86400).optional()
  })
  .strict();

const inlineQueryResultSchema = z.record(z.string(), z.unknown());

const answerInlineQuerySchema = z
  .object({
    inline_query_id: z.string().min(1),
    results: z.array(inlineQueryResultSchema).min(1).max(50),
    cache_time: z.number().int().min(0).max(86400).optional(),
    is_personal: z.boolean().optional(),
    next_offset: z.string().optional(),
    button: z.record(z.string(), z.unknown()).optional()
  })
  .strict();

const labeledPriceSchema = z
  .object({
    label: z.string().min(1).max(32),
    amount: z.number().int()
  })
  .strict();

const shippingOptionSchema = z
  .object({
    id: z.string().min(1).max(64),
    title: z.string().min(1).max(32),
    prices: z.array(labeledPriceSchema).min(1).max(50)
  })
  .strict();

const answerShippingQuerySchema = z
  .object({
    shipping_query_id: z.string().min(1),
    ok: z.boolean(),
    shipping_options: z.array(shippingOptionSchema).min(1).optional(),
    error_message: z.string().min(1).max(256).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.ok && !value.shipping_options) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "answerShippingQuery requires shipping_options when ok=true"
      });
    }

    if (!value.ok && !value.error_message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "answerShippingQuery requires error_message when ok=false"
      });
    }
  });

const answerPreCheckoutQuerySchema = z
  .object({
    pre_checkout_query_id: z.string().min(1),
    ok: z.boolean(),
    error_message: z.string().min(1).max(256).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.ok && !value.error_message) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "answerPreCheckoutQuery requires error_message when ok=false"
      });
    }
  });

const sendMediaGroupSchema = z
  .object({
    chat_id: chatIdSchema,
    media: z
      .array(
        z
          .object({
            type: z.enum(["photo", "video", "document", "audio"]),
            media: z.string().min(1),
            caption: z.string().max(1024).optional(),
            parse_mode: telegramParseModeSchema.optional(),
            caption_entities: z.array(messageEntitySchema).optional(),
            width: z.number().int().positive().optional(),
            height: z.number().int().positive().optional(),
            duration: z.number().int().positive().optional(),
            performer: z.string().optional(),
            title: z.string().optional(),
            supports_streaming: z.boolean().optional(),
            has_spoiler: z.boolean().optional()
          })
          .strict()
      )
      .min(2)
      .max(10),
    disable_notification: z.boolean().optional(),
    protect_content: z.boolean().optional(),
    reply_to_message_id: z.number().int().positive().optional(),
    allow_sending_without_reply: z.boolean().optional(),
    message_thread_id: z.number().int().positive().optional()
  })
  .strict();

const sendChatActionSchema = z
  .object({
    chat_id: chatIdSchema,
    action: z.enum(["typing", "upload_photo", "record_video", "upload_video", "record_voice", "upload_voice", "upload_document", "choose_sticker", "find_location", "record_video_note", "upload_video_note"]),
    message_thread_id: z.number().int().positive().optional()
  })
  .strict();

const restrictChatMemberSchema = z
  .object({
    chat_id: chatIdSchema,
    user_id: templateableIntSchema,
    permissions: z
      .object({
        can_send_messages: z.boolean().optional(),
        can_send_audios: z.boolean().optional(),
        can_send_documents: z.boolean().optional(),
        can_send_photos: z.boolean().optional(),
        can_send_videos: z.boolean().optional(),
        can_send_video_notes: z.boolean().optional(),
        can_send_voice_notes: z.boolean().optional(),
        can_send_polls: z.boolean().optional(),
        can_send_other_messages: z.boolean().optional(),
        can_add_web_page_previews: z.boolean().optional(),
        can_change_info: z.boolean().optional(),
        can_invite_users: z.boolean().optional(),
        can_pin_messages: z.boolean().optional(),
        can_manage_topics: z.boolean().optional()
      })
      .strict(),
    use_independent_chat_permissions: z.boolean().optional(),
    until_date: templateablePositiveIntSchema.optional()
  })
  .strict();

const banChatMemberSchema = z
  .object({
    chat_id: chatIdSchema,
    user_id: templateableIntSchema,
    until_date: templateablePositiveIntSchema.optional(),
    revoke_messages: z.boolean().optional()
  })
  .strict();

const unbanChatMemberSchema = z
  .object({
    chat_id: chatIdSchema,
    user_id: templateableIntSchema,
    only_if_banned: z.boolean().optional()
  })
  .strict();

const getChatMemberSchema = z
  .object({
    chat_id: chatIdSchema,
    user_id: templateableIntSchema
  })
  .strict();

const getChatSchema = z
  .object({
    chat_id: chatIdSchema
  })
  .strict();

const getChatMemberCountSchema = z
  .object({
    chat_id: chatIdSchema
  })
  .strict();

const getChatAdministratorsSchema = z
  .object({
    chat_id: chatIdSchema
  })
  .strict();

const pinChatMessageSchema = z
  .object({
    chat_id: chatIdSchema,
    message_id: templateablePositiveIntSchema,
    disable_notification: z.boolean().optional()
  })
  .strict();

const unpinChatMessageSchema = z
  .object({
    chat_id: chatIdSchema,
    message_id: templateablePositiveIntSchema.optional()
  })
  .strict();

const approveChatJoinRequestSchema = z
  .object({
    chat_id: chatIdSchema,
    user_id: templateableIntSchema
  })
  .strict();

const declineChatJoinRequestSchema = z
  .object({
    chat_id: chatIdSchema,
    user_id: templateableIntSchema
  })
  .strict();

const unpinAllChatMessagesSchema = z
  .object({
    chat_id: chatIdSchema
  })
  .strict();

const leaveChatSchema = z
  .object({
    chat_id: chatIdSchema
  })
  .strict();

const setChatTitleSchema = z
  .object({
    chat_id: chatIdSchema,
    title: z.string().min(1).max(128)
  })
  .strict();

const setChatDescriptionSchema = z
  .object({
    chat_id: chatIdSchema,
    description: z.string().max(255).optional()
  })
  .strict();

const exportChatInviteLinkSchema = z
  .object({
    chat_id: chatIdSchema
  })
  .strict();

const createChatInviteLinkSchema = z
  .object({
    chat_id: chatIdSchema,
    name: z.string().max(32).optional(),
    expire_date: z.number().int().positive().optional(),
    member_limit: z.number().int().min(1).max(99999).optional(),
    creates_join_request: z.boolean().optional()
  })
  .strict();

const editChatInviteLinkSchema = z
  .object({
    chat_id: chatIdSchema,
    invite_link: z.string().min(1),
    name: z.string().max(32).optional(),
    expire_date: z.number().int().positive().optional(),
    member_limit: z.number().int().min(1).max(99999).optional(),
    creates_join_request: z.boolean().optional()
  })
  .strict();

const revokeChatInviteLinkSchema = z
  .object({
    chat_id: chatIdSchema,
    invite_link: z.string().min(1)
  })
  .strict();

const setMyCommandsSchema = z
  .object({
    commands: z
      .array(
        z
          .object({
            command: z.string().regex(/^[a-z0-9_]{1,32}$/),
            description: z.string().min(1).max(256)
          })
          .strict()
      )
      .min(1)
      .max(100),
    scope: z.record(z.string(), z.unknown()).optional(),
    language_code: z.string().max(2).optional()
  })
  .strict();

const deleteMyCommandsSchema = z
  .object({
    scope: z.record(z.string(), z.unknown()).optional(),
    language_code: z.string().max(2).optional()
  })
  .strict();

const getMyCommandsSchema = z
  .object({
    scope: z.record(z.string(), z.unknown()).optional(),
    language_code: z.string().max(2).optional()
  })
  .strict();

const copyMessageSchema = z
  .object({
    chat_id: chatIdSchema,
    from_chat_id: chatIdSchema,
    message_id: z.number().int().positive(),
    caption: z.string().max(1024).optional(),
    parse_mode: telegramParseModeSchema.optional(),
    caption_entities: z.array(messageEntitySchema).optional(),
    disable_notification: z.boolean().optional(),
    protect_content: z.boolean().optional(),
    reply_to_message_id: z.number().int().positive().optional(),
    allow_sending_without_reply: z.boolean().optional(),
    reply_markup: telegramReplyMarkupSchema.optional()
  })
  .strict();

const forwardMessageSchema = z
  .object({
    chat_id: chatIdSchema,
    from_chat_id: chatIdSchema,
    message_id: z.number().int().positive(),
    disable_notification: z.boolean().optional(),
    protect_content: z.boolean().optional()
  })
  .strict();

const deleteWebhookSchema = z
  .object({
    drop_pending_updates: z.boolean().optional()
  })
  .strict();

const getWebhookInfoSchema = z.object({}).strict();
const getMeSchema = z.object({}).strict();

const METHOD_SCHEMAS = {
  sendMessage: sendMessageSchema,
  sendPhoto: sendPhotoSchema,
  sendVideo: sendVideoSchema,
  sendDocument: sendDocumentSchema,
  sendMediaGroup: sendMediaGroupSchema,
  copyMessage: copyMessageSchema,
  forwardMessage: forwardMessageSchema,
  editMessageText: editMessageTextSchema,
  deleteMessage: deleteMessageSchema,
  answerCallbackQuery: answerCallbackQuerySchema,
  answerInlineQuery: answerInlineQuerySchema,
  answerShippingQuery: answerShippingQuerySchema,
  answerPreCheckoutQuery: answerPreCheckoutQuerySchema,
  sendChatAction: sendChatActionSchema,
  restrictChatMember: restrictChatMemberSchema,
  banChatMember: banChatMemberSchema,
  unbanChatMember: unbanChatMemberSchema,
  pinChatMessage: pinChatMessageSchema,
  unpinChatMessage: unpinChatMessageSchema,
  unpinAllChatMessages: unpinAllChatMessagesSchema,
  leaveChat: leaveChatSchema,
  getChat: getChatSchema,
  getChatMember: getChatMemberSchema,
  getChatMemberCount: getChatMemberCountSchema,
  getChatAdministrators: getChatAdministratorsSchema,
  approveChatJoinRequest: approveChatJoinRequestSchema,
  declineChatJoinRequest: declineChatJoinRequestSchema,
  setChatTitle: setChatTitleSchema,
  setChatDescription: setChatDescriptionSchema,
  exportChatInviteLink: exportChatInviteLinkSchema,
  createChatInviteLink: createChatInviteLinkSchema,
  editChatInviteLink: editChatInviteLinkSchema,
  revokeChatInviteLink: revokeChatInviteLinkSchema,
  setMyCommands: setMyCommandsSchema,
  deleteMyCommands: deleteMyCommandsSchema,
  getMyCommands: getMyCommandsSchema,
  getMe: getMeSchema,
  getWebhookInfo: getWebhookInfoSchema,
  deleteWebhook: deleteWebhookSchema
} as const;

export type TelegramMethod = keyof typeof METHOD_SCHEMAS;

export type TelegramMethodParamsMap = {
  [K in TelegramMethod]: z.infer<(typeof METHOD_SCHEMAS)[K]>;
};

export type TelegramMethodParams<M extends TelegramMethod> = TelegramMethodParamsMap[M];

export type TelegramActionType = `telegram.${TelegramMethod}`;

export type TelegramExecutionPolicy = {
  retryClass: "transient" | "permanent";
  timeoutMs: number;
  idempotencyKeyStrategy: "none" | "action_run" | "event_and_action";
  rateLimitBucket: string;
};

export type TelegramCapability = {
  method: TelegramMethod;
  actionType: TelegramActionType;
  label: string;
  category: "messages" | "moderation" | "chat" | "admin" | "meta";
  paramsSchema: (typeof METHOD_SCHEMAS)[TelegramMethod];
  executionPolicy: TelegramExecutionPolicy;
  description: string;
};

function buildCapability(method: TelegramMethod, input: Omit<TelegramCapability, "method" | "actionType" | "paramsSchema">): TelegramCapability {
  return {
    method,
    actionType: `telegram.${method}`,
    paramsSchema: METHOD_SCHEMAS[method],
    ...input
  };
}

export const TELEGRAM_CAPABILITIES: Record<TelegramMethod, TelegramCapability> = {
  sendMessage: buildCapability("sendMessage", { label: "Send Message", category: "messages", description: "Send text and rich entities/markup.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.write" } }),
  sendPhoto: buildCapability("sendPhoto", { label: "Send Photo", category: "messages", description: "Send photo by URL/file id with caption support.", executionPolicy: { retryClass: "transient", timeoutMs: 20_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.write" } }),
  sendVideo: buildCapability("sendVideo", { label: "Send Video", category: "messages", description: "Send video by URL/file id with caption support.", executionPolicy: { retryClass: "transient", timeoutMs: 30_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.write" } }),
  sendDocument: buildCapability("sendDocument", { label: "Send Document", category: "messages", description: "Send document by URL/file id.", executionPolicy: { retryClass: "transient", timeoutMs: 25_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.write" } }),
  sendMediaGroup: buildCapability("sendMediaGroup", { label: "Send Media Group", category: "messages", description: "Send media album (2-10 items).", executionPolicy: { retryClass: "transient", timeoutMs: 30_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.write" } }),
  copyMessage: buildCapability("copyMessage", { label: "Copy Message", category: "messages", description: "Copy a message between chats.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.write" } }),
  forwardMessage: buildCapability("forwardMessage", { label: "Forward Message", category: "messages", description: "Forward message between chats.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.write" } }),
  editMessageText: buildCapability("editMessageText", { label: "Edit Message Text", category: "messages", description: "Edit existing message text with markup.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.write" } }),
  deleteMessage: buildCapability("deleteMessage", { label: "Delete Message", category: "messages", description: "Delete a message in chat.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.write" } }),
  answerCallbackQuery: buildCapability("answerCallbackQuery", { label: "Answer Callback", category: "messages", description: "Answer callback query from inline keyboard.", executionPolicy: { retryClass: "transient", timeoutMs: 8_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.callback" } }),
  answerInlineQuery: buildCapability("answerInlineQuery", { label: "Answer Inline Query", category: "messages", description: "Respond to an inline query with result items.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.inline" } }),
  answerShippingQuery: buildCapability("answerShippingQuery", { label: "Answer Shipping Query", category: "admin", description: "Answer a shipping query for an invoice payment.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.payments" } }),
  answerPreCheckoutQuery: buildCapability("answerPreCheckoutQuery", { label: "Answer Pre-Checkout", category: "admin", description: "Answer a pre-checkout query for an invoice payment.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.payments" } }),
  sendChatAction: buildCapability("sendChatAction", { label: "Send Chat Action", category: "messages", description: "Send typing/upload status.", executionPolicy: { retryClass: "transient", timeoutMs: 8_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.write" } }),
  restrictChatMember: buildCapability("restrictChatMember", { label: "Restrict Chat Member", category: "moderation", description: "Restrict member permissions.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.moderation" } }),
  banChatMember: buildCapability("banChatMember", { label: "Ban Chat Member", category: "moderation", description: "Ban a member from a chat.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.moderation" } }),
  unbanChatMember: buildCapability("unbanChatMember", { label: "Unban Chat Member", category: "moderation", description: "Unban a member in chat.", executionPolicy: { retryClass: "transient", timeoutMs: 15_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.moderation" } }),
  approveChatJoinRequest: buildCapability("approveChatJoinRequest", { label: "Approve Join Request", category: "moderation", description: "Approve a pending chat join request.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.moderation" } }),
  declineChatJoinRequest: buildCapability("declineChatJoinRequest", { label: "Decline Join Request", category: "moderation", description: "Decline a pending chat join request.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.moderation" } }),
  pinChatMessage: buildCapability("pinChatMessage", { label: "Pin Message", category: "chat", description: "Pin message in chat.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.chat" } }),
  unpinChatMessage: buildCapability("unpinChatMessage", { label: "Unpin Message", category: "chat", description: "Unpin one message in chat.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.chat" } }),
  unpinAllChatMessages: buildCapability("unpinAllChatMessages", { label: "Unpin All", category: "chat", description: "Unpin all chat messages.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.chat" } }),
  leaveChat: buildCapability("leaveChat", { label: "Leave Chat", category: "chat", description: "Bot leaves chat.", executionPolicy: { retryClass: "permanent", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.chat" } }),
  getChat: buildCapability("getChat", { label: "Get Chat", category: "meta", description: "Fetch chat details.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.read" } }),
  getChatMember: buildCapability("getChatMember", { label: "Get Chat Member", category: "meta", description: "Fetch member details.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.read" } }),
  getChatMemberCount: buildCapability("getChatMemberCount", { label: "Get Member Count", category: "meta", description: "Fetch member count.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.read" } }),
  getChatAdministrators: buildCapability("getChatAdministrators", { label: "Get Admins", category: "meta", description: "Fetch admin list.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.read" } }),
  setChatTitle: buildCapability("setChatTitle", { label: "Set Chat Title", category: "chat", description: "Set group/channel title.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.chat" } }),
  setChatDescription: buildCapability("setChatDescription", { label: "Set Chat Description", category: "chat", description: "Set group/channel description.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "event_and_action", rateLimitBucket: "telegram.chat" } }),
  exportChatInviteLink: buildCapability("exportChatInviteLink", { label: "Export Invite Link", category: "admin", description: "Export primary invite link.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.admin" } }),
  createChatInviteLink: buildCapability("createChatInviteLink", { label: "Create Invite Link", category: "admin", description: "Create invite link.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.admin" } }),
  editChatInviteLink: buildCapability("editChatInviteLink", { label: "Edit Invite Link", category: "admin", description: "Edit invite link.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.admin" } }),
  revokeChatInviteLink: buildCapability("revokeChatInviteLink", { label: "Revoke Invite Link", category: "admin", description: "Revoke invite link.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.admin" } }),
  setMyCommands: buildCapability("setMyCommands", { label: "Set Commands", category: "admin", description: "Set bot command list.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.admin" } }),
  deleteMyCommands: buildCapability("deleteMyCommands", { label: "Delete Commands", category: "admin", description: "Delete bot command list.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.admin" } }),
  getMyCommands: buildCapability("getMyCommands", { label: "Get Commands", category: "meta", description: "Get bot command list.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.read" } }),
  getMe: buildCapability("getMe", { label: "Get Me", category: "meta", description: "Get bot profile.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.read" } }),
  getWebhookInfo: buildCapability("getWebhookInfo", { label: "Get Webhook Info", category: "meta", description: "Get webhook info.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.read" } }),
  deleteWebhook: buildCapability("deleteWebhook", { label: "Delete Webhook", category: "admin", description: "Delete webhook.", executionPolicy: { retryClass: "transient", timeoutMs: 10_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "telegram.admin" } })
};

export const TELEGRAM_METHODS = Object.keys(TELEGRAM_CAPABILITIES) as TelegramMethod[];

export function getCapabilityByActionType(actionType: TelegramActionType): TelegramCapability {
  const method = actionType.replace("telegram.", "") as TelegramMethod;
  const capability = TELEGRAM_CAPABILITIES[method];
  if (!capability) {
    throw new Error(`Unsupported telegram action type: ${actionType}`);
  }

  return capability;
}

export const TELEGRAM_TRIGGER_TYPES = [
  "message_received",
  "message_edited",
  "channel_post_received",
  "channel_post_edited",
  "command_received",
  "callback_query_received",
  "inline_query_received",
  "chosen_inline_result_received",
  "shipping_query_received",
  "pre_checkout_query_received",
  "poll_received",
  "poll_answer_received",
  "chat_member_updated",
  "my_chat_member_updated",
  "chat_join_request_received",
  "message_reaction_updated",
  "message_reaction_count_updated",
  "update_received"
] as const;

export type TelegramTriggerType = (typeof TELEGRAM_TRIGGER_TYPES)[number];

const actionTriggerCompat: Partial<Record<TelegramActionType, readonly TelegramTriggerType[]>> = {
  "telegram.answerCallbackQuery": ["callback_query_received", "update_received"],
  "telegram.answerInlineQuery": ["inline_query_received", "update_received"],
  "telegram.answerShippingQuery": ["shipping_query_received", "update_received"],
  "telegram.answerPreCheckoutQuery": ["pre_checkout_query_received", "update_received"],
  "telegram.approveChatJoinRequest": ["chat_join_request_received", "update_received"],
  "telegram.declineChatJoinRequest": ["chat_join_request_received", "update_received"]
};

export function isTelegramActionAllowedForTrigger(actionType: TelegramActionType, trigger: TelegramTriggerType): boolean {
  const compat = actionTriggerCompat[actionType];
  if (!compat) {
    return true;
  }

  return compat.includes(trigger);
}

export function getTelegramExecutionPolicy(actionType: TelegramActionType): TelegramExecutionPolicy {
  return getCapabilityByActionType(actionType).executionPolicy;
}

function extractObjectShape(schema: z.ZodTypeAny): Record<string, z.ZodTypeAny> {
  if (schema instanceof z.ZodObject) {
    return schema.shape;
  }

  return {};
}

export const TELEGRAM_CAPABILITIES_MANIFEST = TELEGRAM_METHODS.map((method) => {
  const capability = TELEGRAM_CAPABILITIES[method];
  const shape = extractObjectShape(capability.paramsSchema);
  const fields = Object.entries(shape).map(([name, schema]) => {
    const unwrapped = "unwrap" in schema && typeof schema.unwrap === "function" ? schema.unwrap() : schema;
    return {
      name,
      required: "isOptional" in schema && typeof schema.isOptional === "function" ? !schema.isOptional() : true,
      kind: (unwrapped as { _def?: { typeName?: string } })?._def?.typeName ?? "unknown"
    };
  });

  return {
    method,
    actionType: capability.actionType,
    label: capability.label,
    category: capability.category,
    description: capability.description,
    executionPolicy: capability.executionPolicy,
    fields
  };
});

export { messageEntitySchema, inlineKeyboardMarkupSchema };
