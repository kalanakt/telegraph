export type TelegramChat = {
  id: number;
  type: string;
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
};

export type TelegramMessageEntity = {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: TelegramUser;
  language?: string;
  custom_emoji_id?: string;
};

export type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  text?: string;
  caption?: string;
  entities?: TelegramMessageEntity[];
  caption_entities?: TelegramMessageEntity[];
  reply_markup?: Record<string, unknown>;
  [key: string]: unknown;
};

export type TelegramChannelPost = TelegramMessage;

export type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
  inline_message_id?: string;
  [key: string]: unknown;
};

export type TelegramInlineQuery = {
  id: string;
  from: TelegramUser;
  query: string;
  offset?: string;
  [key: string]: unknown;
};

export type TelegramChosenInlineResult = {
  result_id: string;
  from: TelegramUser;
  query: string;
  [key: string]: unknown;
};

export type TelegramShippingQuery = {
  id: string;
  from: TelegramUser;
  invoice_payload: string;
  [key: string]: unknown;
};

export type TelegramPreCheckoutQuery = {
  id: string;
  from: TelegramUser;
  currency: string;
  total_amount: number;
  invoice_payload: string;
  [key: string]: unknown;
};

export type TelegramPoll = {
  id: string;
  question: string;
  [key: string]: unknown;
};

export type TelegramPollAnswer = {
  poll_id: string;
  user: TelegramUser;
  option_ids: number[];
  [key: string]: unknown;
};

export type TelegramChatMember = {
  user: TelegramUser;
  status: string;
  [key: string]: unknown;
};

export type TelegramChatMemberUpdated = {
  chat: TelegramChat;
  from?: TelegramUser;
  old_chat_member?: TelegramChatMember;
  new_chat_member?: TelegramChatMember;
  [key: string]: unknown;
};

export type TelegramChatJoinRequest = {
  chat: TelegramChat;
  from: TelegramUser;
  user_chat_id: number;
  date: number;
  [key: string]: unknown;
};

export type TelegramMessageReactionUpdated = {
  chat: TelegramChat;
  message_id: number;
  user?: TelegramUser;
  actor_chat?: TelegramChat;
  date: number;
  [key: string]: unknown;
};

export type TelegramMessageReactionCountUpdated = {
  chat: TelegramChat;
  message_id: number;
  date: number;
  [key: string]: unknown;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramChannelPost;
  edited_channel_post?: TelegramChannelPost;
  callback_query?: TelegramCallbackQuery;
  inline_query?: TelegramInlineQuery;
  chosen_inline_result?: TelegramChosenInlineResult;
  shipping_query?: TelegramShippingQuery;
  pre_checkout_query?: TelegramPreCheckoutQuery;
  poll?: TelegramPoll;
  poll_answer?: TelegramPollAnswer;
  my_chat_member?: TelegramChatMemberUpdated;
  chat_member?: TelegramChatMemberUpdated;
  chat_join_request?: TelegramChatJoinRequest;
  message_reaction?: TelegramMessageReactionUpdated;
  message_reaction_count?: TelegramMessageReactionCountUpdated;
  [key: string]: unknown;
};

export type TelegramMeResponse = {
  ok: boolean;
  result?: {
    id: number;
    username?: string;
    first_name?: string;
  };
};

export type TelegramApiResult = {
  ok?: boolean;
  error_code?: number;
  description?: string;
  result?: unknown;
};
