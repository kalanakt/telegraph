import {
  telegramAnswerCallbackQuery,
  telegramBanChatMember,
  telegramDeleteMessage,
  telegramEditMessageText,
  telegramRestrictChatMember,
  telegramSendDocument,
  telegramSendMessage,
  telegramSendPhoto,
  telegramUnbanChatMember,
  type ActionJob,
  type ActionPayload,
  type TelegramRequestResult
} from "@telegram-builder/shared";

type WorkerFailureClass = "transient" | "permanent";

type ActionExecutionError = {
  message: string;
  errorCode?: number;
  classification: WorkerFailureClass;
};

export type WorkerProcessorDeps = {
  updateActionRun(input: {
    actionRunId: string;
    status: "pending" | "succeeded" | "failed";
    attempt: number;
    lastError?: string | null;
  }): Promise<void>;
  countActionRunsByStatus(runId: string, status: "pending" | "failed"): Promise<number>;
  updateWorkflowRunStatus(runId: string, status: "succeeded" | "partially_failed" | "failed"): Promise<void>;
  enqueueDeadLetter(input: { error: string; code?: number; classification: WorkerFailureClass; job: ActionJob }): Promise<void>;
  sendMessage(token: string, chatId: string, text: string): Promise<TelegramRequestResult>;
  sendPhoto(token: string, chatId: string, photoUrl: string, caption?: string): Promise<TelegramRequestResult>;
  sendDocument(token: string, chatId: string, documentUrl: string, caption?: string): Promise<TelegramRequestResult>;
  editMessageText(token: string, chatId: string, messageId: number, text: string): Promise<TelegramRequestResult>;
  deleteMessage(token: string, chatId: string, messageId: number): Promise<TelegramRequestResult>;
  answerCallbackQuery(token: string, callbackQueryId: string, text?: string, showAlert?: boolean): Promise<TelegramRequestResult>;
  restrictChatMember(
    token: string,
    chatId: string,
    userId: number,
    untilDate?: number,
    canSendMessages?: boolean
  ): Promise<TelegramRequestResult>;
  banChatMember(token: string, chatId: string, userId: number, revokeMessages?: boolean): Promise<TelegramRequestResult>;
  unbanChatMember(token: string, chatId: string, userId: number, onlyIfBanned?: boolean): Promise<TelegramRequestResult>;
};

type ActionHandler = (deps: WorkerProcessorDeps, job: ActionJob) => Promise<void>;

function classifyTelegramResult(result: TelegramRequestResult): ActionExecutionError {
  if (result.ok) {
    return { message: "ok", classification: "transient" };
  }

  const code = result.errorCode;
  const permanent = code === 400 || code === 403;
  return {
    message: result.description ?? "Telegram API request failed",
    errorCode: code,
    classification: permanent ? "permanent" : "transient"
  };
}

function classifyThrown(error: unknown): ActionExecutionError {
  if (error instanceof Error && error.message.includes("timeout")) {
    return { message: error.message, classification: "transient" };
  }

  if (error instanceof Error) {
    return { message: error.message, classification: "transient" };
  }

  return { message: "Unknown worker error", classification: "transient" };
}

function renderTemplate(value: string, job: ActionJob): string {
  return value.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_full, path) => {
    if (path.startsWith("vars.")) {
      const key = path.replace("vars.", "");
      return job.context.variables[key] ?? "";
    }

    switch (path) {
      case "event.text":
        return job.event.text;
      case "event.chatId":
        return job.event.chatId;
      case "event.chatType":
        return job.event.chatType;
      case "event.fromUserId":
        return String(job.event.fromUserId ?? "");
      case "event.messageId":
        return String(job.event.messageId ?? "");
      case "event.callbackData":
        return "callbackData" in job.event ? String(job.event.callbackData ?? "") : "";
      case "event.command":
        return "command" in job.event ? String(job.event.command ?? "") : "";
      case "event.commandArgs":
        return "commandArgs" in job.event ? String(job.event.commandArgs ?? "") : "";
      case "event.inlineQuery":
        return "inlineQuery" in job.event ? String(job.event.inlineQuery ?? "") : "";
      default:
        return "";
    }
  });
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`action timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function getActionHandler(action: ActionPayload): ActionHandler {
  switch (action.type) {
    case "send_text":
      return async (deps, job) => {
        const chatId = action.chatId ?? job.event.chatId;
        const result = await deps.sendMessage(job.botToken, chatId, renderTemplate(action.text, job));
        const error = classifyTelegramResult(result);
        if (!result.ok) {
          throw error;
        }
      };
    case "send_photo":
      return async (deps, job) => {
        const chatId = action.chatId ?? job.event.chatId;
        const caption = action.caption ? renderTemplate(action.caption, job) : undefined;
        const result = await deps.sendPhoto(job.botToken, chatId, action.photoUrl, caption);
        if (!result.ok) {
          throw classifyTelegramResult(result);
        }
      };
    case "send_document":
      return async (deps, job) => {
        const chatId = action.chatId ?? job.event.chatId;
        const caption = action.caption ? renderTemplate(action.caption, job) : undefined;
        const result = await deps.sendDocument(job.botToken, chatId, action.documentUrl, caption);
        if (!result.ok) {
          throw classifyTelegramResult(result);
        }
      };
    case "edit_message_text":
      return async (deps, job) => {
        const chatId = action.chatId ?? job.event.chatId;
        const messageId = action.messageId ?? job.event.messageId;
        if (!messageId) {
          throw { message: "edit_message_text requires messageId", classification: "permanent" } satisfies ActionExecutionError;
        }

        const result = await deps.editMessageText(job.botToken, chatId, messageId, renderTemplate(action.text, job));
        if (!result.ok) {
          throw classifyTelegramResult(result);
        }
      };
    case "delete_message":
      return async (deps, job) => {
        const chatId = action.chatId ?? job.event.chatId;
        const messageId = action.messageId ?? job.event.messageId;
        if (!messageId) {
          throw { message: "delete_message requires messageId", classification: "permanent" } satisfies ActionExecutionError;
        }

        const result = await deps.deleteMessage(job.botToken, chatId, messageId);
        if (!result.ok) {
          throw classifyTelegramResult(result);
        }
      };
    case "answer_callback_query":
      return async (deps, job) => {
        const callbackQueryId = action.callbackQueryId ?? job.event.callbackQueryId;
        if (!callbackQueryId) {
          throw { message: "answer_callback_query requires callbackQueryId", classification: "permanent" } satisfies ActionExecutionError;
        }

        const result = await deps.answerCallbackQuery(
          job.botToken,
          callbackQueryId,
          action.text ? renderTemplate(action.text, job) : undefined,
          action.showAlert
        );
        if (!result.ok) {
          throw classifyTelegramResult(result);
        }
      };
    case "delay":
      return async () => {
        await new Promise((resolve) => setTimeout(resolve, action.delayMs));
      };
    case "set_variable":
      return async (_deps, job) => {
        job.context.variables[action.key] = renderTemplate(action.value, job);
      };
    case "branch_on_variable":
      return async () => {
        // Branching is represented in graph conditions; this action is metadata-only for compatibility.
      };
    case "restrict_chat_member":
      return async (deps, job) => {
        const chatId = action.chatId ?? job.event.chatId;
        const result = await deps.restrictChatMember(
          job.botToken,
          chatId,
          action.userId,
          action.untilDate,
          action.canSendMessages
        );
        if (!result.ok) {
          throw classifyTelegramResult(result);
        }
      };
    case "ban_chat_member":
      return async (deps, job) => {
        const chatId = action.chatId ?? job.event.chatId;
        const result = await deps.banChatMember(job.botToken, chatId, action.userId, action.revokeMessages);
        if (!result.ok) {
          throw classifyTelegramResult(result);
        }
      };
    case "unban_chat_member":
      return async (deps, job) => {
        const chatId = action.chatId ?? job.event.chatId;
        const result = await deps.unbanChatMember(job.botToken, chatId, action.userId, action.onlyIfBanned);
        if (!result.ok) {
          throw classifyTelegramResult(result);
        }
      };
    default:
      return async () => {
        throw { message: `Unsupported action type: ${(action as { type: string }).type}`, classification: "permanent" } satisfies ActionExecutionError;
      };
  }
}

function isExecutionError(input: unknown): input is ActionExecutionError {
  return typeof input === "object" && input !== null && "classification" in input && "message" in input;
}

function shouldFailFast(error: ActionExecutionError): boolean {
  return error.classification === "permanent";
}

export async function processActionJob(
  deps: WorkerProcessorDeps,
  job: ActionJob,
  attemptsStarted: number
): Promise<void> {
  await deps.updateActionRun({
    actionRunId: job.actionRunId,
    status: "pending",
    attempt: attemptsStarted
  });

  const handler = getActionHandler(job.action);

  try {
    await withTimeout(handler(deps, job), job.executionPolicy.timeoutMs);
  } catch (error) {
    const normalized = isExecutionError(error) ? error : classifyThrown(error);
    const wrapped = new Error(normalized.message);
    (wrapped as Error & { code?: number; classification?: WorkerFailureClass }).code = normalized.errorCode;
    (wrapped as Error & { code?: number; classification?: WorkerFailureClass }).classification = normalized.classification;
    throw wrapped;
  }

  await deps.updateActionRun({
    actionRunId: job.actionRunId,
    status: "succeeded",
    attempt: attemptsStarted,
    lastError: null
  });

  const pendingCount = await deps.countActionRunsByStatus(job.runId, "pending");
  if (pendingCount > 0) {
    return;
  }

  const failedCount = await deps.countActionRunsByStatus(job.runId, "failed");
  await deps.updateWorkflowRunStatus(job.runId, failedCount > 0 ? "partially_failed" : "succeeded");
}

export async function handleActionJobFailure(
  deps: WorkerProcessorDeps,
  job: ActionJob,
  attemptsMade: number,
  maxAttempts: number,
  errorMessage: string,
  classification: WorkerFailureClass = "transient",
  code?: number
): Promise<void> {
  const exhausted = attemptsMade >= maxAttempts || shouldFailFast({ message: errorMessage, classification, errorCode: code });

  await deps.updateActionRun({
    actionRunId: job.actionRunId,
    status: exhausted ? "failed" : "pending",
    lastError: errorMessage,
    attempt: attemptsMade
  });

  if (!exhausted) {
    return;
  }

  await deps.updateWorkflowRunStatus(job.runId, "failed");
  await deps.enqueueDeadLetter({
    error: errorMessage,
    code,
    classification,
    job
  });
}

export const workerTelegramDeps = {
  sendMessage: telegramSendMessage,
  sendPhoto: telegramSendPhoto,
  sendDocument: telegramSendDocument,
  editMessageText: telegramEditMessageText,
  deleteMessage: telegramDeleteMessage,
  answerCallbackQuery: telegramAnswerCallbackQuery,
  restrictChatMember: telegramRestrictChatMember,
  banChatMember: telegramBanChatMember,
  unbanChatMember: telegramUnbanChatMember
};
