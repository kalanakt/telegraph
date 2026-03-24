export type TelegramChat = {
  id: number;
  type: string;
};

export type TelegramUser = {
  id: number;
  username?: string;
};

export type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  caption?: string;
};

export type TelegramChannelPost = {
  message_id: number;
  chat: TelegramChat;
  text?: string;
  caption?: string;
};

export type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
};

export type TelegramInlineQuery = {
  id: string;
  from: TelegramUser;
  query: string;
};

export type TelegramChatMember = {
  user: TelegramUser;
  status: string;
};

export type TelegramChatMemberUpdated = {
  chat: TelegramChat;
  from?: TelegramUser;
  old_chat_member?: TelegramChatMember;
  new_chat_member?: TelegramChatMember;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramChannelPost;
  edited_channel_post?: TelegramChannelPost;
  callback_query?: TelegramCallbackQuery;
  inline_query?: TelegramInlineQuery;
  my_chat_member?: TelegramChatMemberUpdated;
  chat_member?: TelegramChatMemberUpdated;
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
};
