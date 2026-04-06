import type { TelegramUpdate, TelegramUser } from "../types/telegram.js";

export type TelegramActor = Pick<
  TelegramUser,
  "id" | "username" | "first_name" | "last_name" | "language_code" | "is_bot"
>;

export function extractTelegramActor(update: TelegramUpdate): TelegramActor | null {
  const actor =
    update.message?.from ??
    update.edited_message?.from ??
    update.callback_query?.from ??
    update.inline_query?.from ??
    update.chosen_inline_result?.from ??
    update.shipping_query?.from ??
    update.pre_checkout_query?.from ??
    update.poll_answer?.user ??
    update.chat_member?.from ??
    update.my_chat_member?.from ??
    update.chat_join_request?.from ??
    update.message_reaction?.user ??
    null;

  if (!actor || actor.is_bot) {
    return null;
  }

  return actor;
}
