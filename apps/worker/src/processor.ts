import { createHash } from "node:crypto";
import {
  asJsonValue,
  getCapabilityByActionType,
  getExecutionPolicy,
  getFrontierActions,
  getPathValue,
  telegramInvokeMethod,
  toTemplateString,
  type ActionExecutionResult,
  type ActionJob,
  type ActionPayload,
  type JsonValue,
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

type ActionRunLookup = {
  actionRunId: string;
  created: boolean;
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
  getWorkflowRunContext(runId: string): Promise<Record<string, JsonValue>>;
  updateWorkflowRunContext(runId: string, variables: Record<string, JsonValue>): Promise<void>;
  getOrCreateActionRun(input: { runId: string; actionId: string; action: ActionPayload }): Promise<ActionRunLookup>;
  enqueueAction(job: ActionJob): Promise<void>;
  enqueueDeadLetter(input: DeadLetterInput): Promise<void>;
  invokeTelegramMethod(token: string, method: TelegramMethod, params: Record<string, unknown>): Promise<TelegramRequestResult>;
  invokeHttpRequest?(input: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs: number;
  }): Promise<Response>;
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

function classifyHttpStatus(status: number, fallback: string): ActionExecutionError {
  const permanent = status >= 400 && status < 500 && status !== 408 && status !== 429;
  return {
    message: fallback,
    errorCode: status,
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

function renderTemplate(value: string, job: ActionJob, variables: Record<string, JsonValue>): string {
  return value.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_full, path) => {
    if (path.startsWith("vars.")) {
      return toTemplateString(getPathValue(variables, path.replace(/^vars\./, "")));
    }

    if (path.startsWith("event.")) {
      return toTemplateString(getPathValue(job.event, path.replace(/^event\./, "")));
    }

    return "";
  });
}

function renderTemplatesDeep(value: unknown, job: ActionJob, variables: Record<string, JsonValue>): unknown {
  if (typeof value === "string") {
    return renderTemplate(value, job, variables);
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderTemplatesDeep(item, job, variables));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, renderTemplatesDeep(nested, job, variables)])
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

async function readResponseBody(response: Response, mode: "auto" | "json" | "text"): Promise<JsonValue | string | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  if (mode === "text") {
    return text;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const shouldParseJson = mode === "json" || contentType.includes("application/json");
  if (!shouldParseJson) {
    return text;
  }

  try {
    return asJsonValue(JSON.parse(text));
  } catch {
    return text;
  }
}

function responseHeadersToObject(headers: Headers): Record<string, string> {
  return Object.fromEntries(headers.entries());
}

async function invokeHttp(
  deps: WorkerProcessorDeps,
  input: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
    timeoutMs: number;
  }
) {
  if (deps.invokeHttpRequest) {
    return deps.invokeHttpRequest(input);
  }

  return fetch(input.url, {
    method: input.method,
    headers: input.headers,
    body: input.body
  });
}

function applyAuth(
  headers: Record<string, string>,
  query: URLSearchParams,
  auth: NonNullable<Extract<ActionPayload, { type: "http.request" | "webhook.send" }>["params"]["auth"]> | undefined
) {
  if (!auth || auth.type === "none") {
    return;
  }

  switch (auth.type) {
    case "bearer":
      headers.authorization = `Bearer ${auth.token}`;
      break;
    case "basic":
      headers.authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString("base64")}`;
      break;
    case "api_key_header":
      headers[auth.header] = auth.value;
      break;
    case "api_key_query":
      query.set(auth.key, auth.value);
      break;
  }
}

async function runHttpAction(
  deps: WorkerProcessorDeps,
  job: ActionJob,
  variables: Record<string, JsonValue>
): Promise<ActionExecutionResult> {
  const action = job.action as Extract<ActionPayload, { type: "http.request" | "webhook.send" }>;
  const isWebhook = action.type === "webhook.send";
  const params =
    action.type === "http.request"
      ? action.params
      : {
          method: "POST" as const,
          url: action.params.url,
          headers: action.params.headers,
          query: action.params.query,
          auth: action.params.auth,
          body_mode: "json" as const,
          body: action.params.body,
          timeout_ms: action.params.timeout_ms,
          response_body_format: action.params.response_body_format
        };

  const renderedHeaders = (renderTemplatesDeep(params.headers ?? {}, job, variables) as Record<string, string>) ?? {};
  const renderedQuery = (renderTemplatesDeep(params.query ?? {}, job, variables) as Record<string, string>) ?? {};
  const renderedBody = renderTemplatesDeep(params.body, job, variables);
  const url = new URL(renderTemplate(params.url, job, variables));

  for (const [key, value] of Object.entries(renderedQuery)) {
    url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { ...renderedHeaders };
  applyAuth(headers, url.searchParams, params.auth);

  let body: string | undefined;
  if (typeof renderedBody !== "undefined") {
    if ((params.body_mode ?? "json") === "text" && typeof renderedBody === "string") {
      body = renderedBody;
      headers["content-type"] = headers["content-type"] ?? "text/plain";
    } else {
      body = JSON.stringify(renderedBody);
      headers["content-type"] = headers["content-type"] ?? "application/json";
    }
  }

  const response = await invokeHttp(deps, {
    method: params.method,
    url: url.toString(),
    headers,
    body,
    timeoutMs: params.timeout_ms ?? job.executionPolicy.timeoutMs
  });

  const result: ActionExecutionResult = {
    status: response.status,
    ok: response.ok,
    headers: responseHeadersToObject(response.headers),
    body: await readResponseBody(response, params.response_body_format ?? "auto")
  };

  if (!response.ok) {
    const bodyPreview = typeof result.body === "string" ? result.body : JSON.stringify(result.body);
    throw classifyHttpStatus(response.status, bodyPreview || `${isWebhook ? "Webhook" : "HTTP"} request failed`);
  }

  return result;
}

async function runTelegramAction(
  deps: WorkerProcessorDeps,
  job: ActionJob,
  variables: Record<string, JsonValue>
): Promise<ActionExecutionResult> {
  if (!job.botToken) {
    throw {
      message: "Missing bot token for Telegram action",
      classification: "permanent"
    } satisfies ActionExecutionError;
  }

  const telegramAction = job.action as Extract<ActionPayload, { type: `telegram.${string}` }>;
  const capability = getCapabilityByActionType(telegramAction.type);
  const renderedParams = renderTemplatesDeep(telegramAction.params, job, variables) as Record<string, unknown>;

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

  return {
    status: result.ok ? 200 : result.errorCode ?? 500,
    ok: result.ok,
    headers: {},
    body: asJsonValue(result.result ?? null)
  };
}

async function executeAction(
  deps: WorkerProcessorDeps,
  job: ActionJob,
  variables: Record<string, JsonValue>
): Promise<ActionExecutionResult> {
  if (job.action.type.startsWith("telegram.")) {
    return runTelegramAction(deps, job, variables);
  }

  return runHttpAction(deps, job, variables);
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

  const existingVariables = await deps.getWorkflowRunContext(job.runId);
  const variables = { ...job.context.variables, ...existingVariables };

  let result: ActionExecutionResult;
  try {
    result = await withTimeout(executeAction(deps, job, variables), job.executionPolicy.timeoutMs);
  } catch (error) {
    const normalized = isExecutionError(error) ? error : classifyThrown(error);
    const wrapped = new Error(normalized.message);
    (wrapped as Error & { code?: number; classification?: WorkerFailureClass }).code = normalized.errorCode;
    (wrapped as Error & { code?: number; classification?: WorkerFailureClass }).classification = normalized.classification;
    throw wrapped;
  }

  const mergedVariables: Record<string, JsonValue> = {
    ...variables,
    [job.actionNodeId]: {
      status: result.status,
      ok: result.ok,
      headers: result.headers,
      body: result.body
    }
  };

  await deps.updateWorkflowRunContext(job.runId, mergedVariables);
  await deps.updateActionRun({
    actionRunId: job.actionRunId,
    status: "succeeded",
    attempt: attemptsStarted,
    lastError: null
  });

  const nextActions = getFrontierActions(job.flowDefinition, job.actionNodeId, job.event, { variables: mergedVariables });
  for (const nextAction of nextActions) {
    const nextRun = await deps.getOrCreateActionRun({
      runId: job.runId,
      actionId: nextAction.actionId,
      action: nextAction.payload
    });

    if (!nextRun.created) {
      continue;
    }

    await deps.enqueueAction({
      ...job,
      actionNodeId: nextAction.actionId,
      actionRunId: nextRun.actionRunId,
      actionType: nextAction.payload.type,
      action: nextAction.payload,
      executionPolicy: getExecutionPolicy(nextAction.payload.type),
      botToken: nextAction.payload.type.startsWith("telegram.") ? job.botToken : null,
      idempotencyKey: `${job.event.eventId}:${nextRun.actionRunId}:${nextAction.payload.type}`,
      context: {
        ...job.context,
        variables: mergedVariables
      }
    });
  }

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
      method: job.action.type.startsWith("telegram.")
        ? getCapabilityByActionType(job.action.type as Extract<ActionPayload, { type: `telegram.${string}` }>["type"]).method
        : job.action.type,
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
