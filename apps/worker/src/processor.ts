import { createHash } from "node:crypto";
import {
  getCapabilityByActionType,
  telegramInvokeMethod,
  type ActionJob,
  type TelegramMethod,
  type TelegramRequestResult
} from "@telegram-builder/shared";

type WorkerFailureClass = "transient" | "permanent";

type ActionExecutionError = {
  message: string;
  errorCode?: number;
  classification: WorkerFailureClass;
};

type DeadLetterInput = {
  error: string;
  code?: number;
  classification: WorkerFailureClass;
  job: ActionJob;
  metadata: {
    actionType: string;
    method: string;
    payloadHash: string;
    trigger: string;
    updateId: number;
  };
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
  enqueueDeadLetter(input: DeadLetterInput): Promise<void>;
  invokeTelegramMethod(token: string, method: TelegramMethod, params: Record<string, unknown>): Promise<TelegramRequestResult>;
};

function payloadHash(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function classifyTelegramResult(result: TelegramRequestResult): ActionExecutionError {
  if (result.ok) {
    return { message: "ok", classification: "transient" };
  }

  const code = result.errorCode;
  const permanentCodes = new Set([400, 401, 403, 404, 409, 413, 429]);
  const permanent = code ? permanentCodes.has(code) : false;
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
        return job.event.text ?? "";
      case "event.chatId":
        return job.event.chatId ?? "";
      case "event.chatType":
        return job.event.chatType ?? "";
      case "event.fromUserId":
        return String(job.event.fromUserId ?? "");
      case "event.fromUsername":
        return String(job.event.fromUsername ?? "");
      case "event.messageId":
        return String(job.event.messageId ?? "");
      case "event.callbackData":
        return String(job.event.callbackData ?? "");
      case "event.callbackQueryId":
        return String(job.event.callbackQueryId ?? "");
      case "event.command":
        return String(job.event.command ?? "");
      case "event.commandArgs":
        return String(job.event.commandArgs ?? "");
      case "event.inlineQueryId":
        return String(job.event.inlineQueryId ?? "");
      case "event.inlineQuery":
        return String(job.event.inlineQuery ?? "");
      case "event.shippingQueryId":
        return String(job.event.shippingQueryId ?? "");
      case "event.preCheckoutQueryId":
        return String(job.event.preCheckoutQueryId ?? "");
      case "event.targetUserId":
        return String(job.event.targetUserId ?? "");
      case "event.oldStatus":
        return String(job.event.oldStatus ?? "");
      case "event.newStatus":
        return String(job.event.newStatus ?? "");
      default:
        return "";
    }
  });
}

function renderTemplatesDeep(value: unknown, job: ActionJob): unknown {
  if (typeof value === "string") {
    return renderTemplate(value, job);
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderTemplatesDeep(item, job));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, renderTemplatesDeep(nested, job)])
    );
  }

  return value;
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

async function runTelegramAction(deps: WorkerProcessorDeps, job: ActionJob): Promise<void> {
  const capability = getCapabilityByActionType(job.action.type);
  const renderedParams = renderTemplatesDeep(job.action.params, job) as Record<string, unknown>;

  let parsedParams: Record<string, unknown>;
  try {
    parsedParams = capability.paramsSchema.parse(renderedParams) as Record<string, unknown>;
  } catch (error) {
    const firstIssue =
      typeof error === "object" && error !== null && "issues" in error
        ? (error as { issues?: Array<{ message?: string }> }).issues?.[0]?.message
        : undefined;

    throw {
      message: firstIssue ? `Invalid action params: ${firstIssue}` : "Invalid action params",
      classification: "permanent"
    } satisfies ActionExecutionError;
  }

  const result = await deps.invokeTelegramMethod(job.botToken, capability.method, parsedParams);
  if (!result.ok) {
    throw classifyTelegramResult(result);
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

  try {
    await withTimeout(runTelegramAction(deps, job), job.executionPolicy.timeoutMs);
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
    job,
    metadata: {
      actionType: job.action.type,
      method: getCapabilityByActionType(job.action.type).method,
      payloadHash: payloadHash(job.action.params),
      trigger: job.event.trigger,
      updateId: job.event.updateId
    }
  });
}

export const workerTelegramDeps = {
  invokeTelegramMethod: telegramInvokeMethod
};

export type { ActionExecutionError, DeadLetterInput, WorkerFailureClass };
