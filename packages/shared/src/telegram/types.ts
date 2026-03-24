import type { TelegramMethod, TelegramMethodParams } from "./capabilities.js";

export type TelegramRequestResult = {
  ok: boolean;
  errorCode?: number;
  description?: string;
  result?: unknown;
};

export type { TelegramMethod, TelegramMethodParams };
