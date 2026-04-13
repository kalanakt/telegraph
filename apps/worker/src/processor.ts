import { createHash } from "node:crypto";
import {
  asJsonValue,
  actionSchema,
  cryptoPayCreateInvoice,
  CryptoPayRequestError,
  createEmptyWorkflowContext,
  getCapabilityByActionType,
  getContextScopeValue,
  getExecutionPolicy,
  getFrontierActions,
  getPathValue,
  setPathValue,
  setContextScopeValue,
  telegramInvokeMethod,
  toTemplateString,
  type ActionExecutionResult,
  type ActionJob,
  type ActionPayload,
  type ExecutablePayload,
  type JsonValue,
  type TelegramMethod,
  type TelegramRequestResult,
  type WorkflowContext
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
  updateWorkflowRunStatus(runId: string, status: "succeeded" | "partially_failed" | "failed" | "waiting"): Promise<void>;
  getWorkflowRunContext(runId: string): Promise<WorkflowContext>;
  updateWorkflowRunContext(runId: string, context: WorkflowContext): Promise<void>;
  syncRuntimeState(input: { runId: string; context: WorkflowContext }): Promise<WorkflowContext>;
  createCheckpoint(input: {
    runId: string;
    ruleId: string;
    nodeId: string;
    checkpointType: ExecutablePayload["type"];
    sessionId: string;
    metadata: Record<string, JsonValue>;
    expiresAt?: Date;
  }): Promise<{ checkpointId: string }>;
  getOrCreateActionRun(input: { runId: string; actionId: string; action: ExecutablePayload }): Promise<ActionRunLookup>;
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
  invokeCryptoPayMethod?(input: {
    token: string;
    method: "createInvoice";
    params: Record<string, unknown>;
    useTestnet?: boolean;
  }): Promise<unknown>;
};

function payloadHash(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function getNodeKey(job: ActionJob): string | undefined {
  const node = job.flowDefinition.nodes.find((item) => item.id === job.actionNodeId);
  return node?.meta?.key?.trim() || undefined;
}

function buildResultRecord(result: ActionExecutionResult): JsonValue {
  return {
    status: result.status,
    ok: result.ok,
    headers: result.headers,
    body: result.body
  };
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
  if (error instanceof CryptoPayRequestError) {
    const permanent = typeof error.status === "number" && error.status >= 400 && error.status < 500;
    return {
      message: error.message,
      errorCode: error.status,
      classification: permanent ? "permanent" : "transient"
    };
  }

  if (error instanceof Error && error.message.includes("timeout")) {
    return { message: error.message, classification: "transient" };
  }

  if (error instanceof Error) {
    return { message: error.message, classification: "transient" };
  }

  return { message: "Unknown worker error", classification: "transient" };
}

function renderTemplate(value: string, job: ActionJob, context: WorkflowContext): string {
  return value.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_full, path) => {
    if (path.startsWith("event.")) {
      return toTemplateString(getPathValue(job.event, path.replace(/^event\./, "")));
    }

    return toTemplateString(getContextScopeValue(context, path));
  });
}

function renderTemplatesDeep(value: unknown, job: ActionJob, context: WorkflowContext): unknown {
  if (typeof value === "string") {
    return renderTemplate(value, job, context);
  }

  if (Array.isArray(value)) {
    return value.map((item) => renderTemplatesDeep(item, job, context));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, renderTemplatesDeep(nested, job, context)])
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
  context: WorkflowContext
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

  const renderedHeaders = (renderTemplatesDeep(params.headers ?? {}, job, context) as Record<string, string>) ?? {};
  const renderedQuery = (renderTemplatesDeep(params.query ?? {}, job, context) as Record<string, string>) ?? {};
  const renderedBody = renderTemplatesDeep(params.body, job, context);
  const url = new URL(renderTemplate(params.url, job, context));

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
  context: WorkflowContext
): Promise<ActionExecutionResult> {
  if (!job.botToken) {
    throw {
      message: "Missing bot token for Telegram action",
      classification: "permanent"
    } satisfies ActionExecutionError;
  }

  const telegramAction = job.action as Extract<ActionPayload, { type: `telegram.${string}` }>;
  const capability = getCapabilityByActionType(telegramAction.type);
  const renderedParams = renderTemplatesDeep(telegramAction.params, job, context) as Record<string, unknown>;

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

async function runCryptoPayAction(
  deps: WorkerProcessorDeps,
  job: ActionJob,
  context: WorkflowContext
): Promise<ActionExecutionResult> {
  if (!job.cryptoPayToken) {
    throw {
      message: "Missing Crypto Pay token for Crypto Pay action",
      classification: "permanent"
    } satisfies ActionExecutionError;
  }

  const renderedParams = renderTemplatesDeep(
    (job.action as Extract<ActionPayload, { type: "cryptopay.createInvoice" }>).params,
    job,
    context
  ) as Record<string, unknown>;

  if (!renderedParams.payload) {
    renderedParams.payload =
      (typeof context.order.invoicePayload === "string" && context.order.invoicePayload) ||
      (typeof context.order.externalId === "string" && context.order.externalId) ||
      (typeof context.order.id === "string" && context.order.id) ||
      job.runId;
  }

  let parsedAction: Extract<ActionPayload, { type: "cryptopay.createInvoice" }>;
  try {
    parsedAction = actionSchema.parse({
      type: "cryptopay.createInvoice",
      params: renderedParams
    }) as Extract<ActionPayload, { type: "cryptopay.createInvoice" }>;
  } catch (error) {
    const firstIssue =
      typeof error === "object" && error !== null && "issues" in error
        ? (error as { issues?: Array<{ message?: string }> }).issues?.[0]?.message
        : undefined;

    throw {
      message: firstIssue ? `Invalid Crypto Pay params: ${firstIssue}` : "Invalid Crypto Pay params",
      classification: "permanent"
    } satisfies ActionExecutionError;
  }

  const result = deps.invokeCryptoPayMethod
    ? await deps.invokeCryptoPayMethod({
        token: job.cryptoPayToken,
        method: "createInvoice",
        params: parsedAction.params as Record<string, unknown>,
        useTestnet: job.cryptoPayUseTestnet ?? false
      })
    : await cryptoPayCreateInvoice(job.cryptoPayToken, parsedAction.params, {
        useTestnet: job.cryptoPayUseTestnet ?? false
      });

  return {
    status: 200,
    ok: true,
    headers: {},
    body: asJsonValue(result)
  };
}

async function runWorkflowInternalAction(
  job: ActionJob,
  context: WorkflowContext
): Promise<ActionExecutionResult> {
  if (job.action.type === "workflow.delay") {
    return {
      status: 200,
      ok: true,
      headers: {},
      body: {
        delay_ms: job.action.params.delay_ms,
        resumed: true
      }
    };
  }

  if (job.action.type === "workflow.setVariable") {
    const action = job.action as Extract<ExecutablePayload, { type: "workflow.setVariable" }>;
    const renderedValue = renderTemplatesDeep(action.params.value, job, context);
    return {
      status: 200,
      ok: true,
      headers: {},
      body: {
        path: action.params.path,
        value: asJsonValue(renderedValue)
      }
    };
  }

  if (job.action.type === "workflow.upsertCustomer") {
    return {
      status: 200,
      ok: true,
      headers: {},
      body: {
        profile: asJsonValue(renderTemplatesDeep(job.action.params.profile, job, context))
      }
    };
  }

  if (job.action.type === "workflow.upsertOrder" || job.action.type === "workflow.createInvoice") {
    return {
      status: 200,
      ok: true,
      headers: {},
      body: asJsonValue(renderTemplatesDeep(job.action.params, job, context))
    };
  }

  if (job.action.type === "workflow.orderTransition") {
    return {
      status: 200,
      ok: true,
      headers: {},
      body: {
        status: job.action.params.status,
        note: job.action.params.note ?? null
      }
    };
  }

  if (
    job.action.type === "workflow.awaitMessage" ||
    job.action.type === "workflow.awaitCallback" ||
    job.action.type === "workflow.collectContact" ||
    job.action.type === "workflow.collectShipping" ||
    job.action.type === "workflow.formStep"
  ) {
    return {
      status: 202,
      ok: true,
      headers: {},
      body: asJsonValue(job.action.params)
    };
  }

  return {
    status: 200,
    ok: true,
    headers: {},
    body: null
  };
}

async function executeAction(
  deps: WorkerProcessorDeps,
  job: ActionJob,
  context: WorkflowContext
): Promise<ActionExecutionResult> {
  if (job.action.type.startsWith("telegram.")) {
    return runTelegramAction(deps, job, context);
  }

  if (job.action.type.startsWith("cryptopay.")) {
    return runCryptoPayAction(deps, job, context);
  }

  if (job.action.type.startsWith("workflow.")) {
    return runWorkflowInternalAction(job, context);
  }

  return runHttpAction(deps, job, context);
}

function isExecutionError(input: unknown): input is ActionExecutionError {
  return typeof input === "object" && input !== null && "classification" in input && "message" in input;
}

function shouldFailFast(error: ActionExecutionError): boolean {
  return error.classification === "permanent";
}

function isWaitingAction(action: ExecutablePayload["type"]) {
  return (
    action === "workflow.awaitMessage" ||
    action === "workflow.awaitCallback" ||
    action === "workflow.collectContact" ||
    action === "workflow.collectShipping" ||
    action === "workflow.formStep"
  );
}

function buildCheckpointMetadata(job: ActionJob): Record<string, JsonValue> {
  switch (job.action.type) {
    case "workflow.awaitMessage":
      return {
        store_as: job.action.params.store_as ?? null
      };
    case "workflow.awaitCallback":
      return {
        store_as: job.action.params.store_as ?? null,
        callback_prefix: job.action.params.callback_prefix ?? null
      };
    case "workflow.formStep":
      return {
        field: job.action.params.field,
        source: job.action.params.source
      };
    default:
      return {};
  }
}

function mergeRuntimeContext(job: ActionJob, existing: WorkflowContext): WorkflowContext {
  const legacyVariables =
    "variables" in job.context && job.context.variables && typeof job.context.variables === "object"
      ? (job.context.variables as Record<string, JsonValue>)
      : {};
  const runtime = job.context.runtime ?? createEmptyWorkflowContext({ variables: legacyVariables });
  return createEmptyWorkflowContext({
    variables: { ...runtime.variables, ...existing.variables },
    session: { ...runtime.session, ...existing.session },
    customer: { ...runtime.customer, ...existing.customer },
    order: { ...runtime.order, ...existing.order }
  });
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

  const existingContext = await deps.getWorkflowRunContext(job.runId);
  const runtimeContext = mergeRuntimeContext(job, existingContext);

  let result: ActionExecutionResult;
  try {
    result = await withTimeout(executeAction(deps, job, runtimeContext), job.executionPolicy.timeoutMs);
  } catch (error) {
    const normalized = isExecutionError(error) ? error : classifyThrown(error);
    const wrapped = new Error(normalized.message);
    (wrapped as Error & { code?: number; classification?: WorkerFailureClass }).code = normalized.errorCode;
    (wrapped as Error & { code?: number; classification?: WorkerFailureClass }).classification = normalized.classification;
    throw wrapped;
  }

  let mergedContext = createEmptyWorkflowContext(runtimeContext);

  if (job.action.type === "workflow.setVariable") {
    const resultBody =
      typeof result.body === "object" && result.body !== null && "value" in result.body
        ? (result.body as { value: JsonValue }).value
        : null;
    mergedContext = {
      ...mergedContext,
      variables: setPathValue(mergedContext.variables, job.action.params.path, asJsonValue(resultBody))
    };
  }

  if (job.action.type === "workflow.upsertCustomer") {
    const profile =
      typeof result.body === "object" && result.body !== null && "profile" in result.body
        ? (result.body as { profile: JsonValue }).profile
        : {};
    mergedContext = {
      ...mergedContext,
      customer: {
        ...mergedContext.customer,
        ...(typeof profile === "object" && profile !== null && !Array.isArray(profile)
          ? (profile as WorkflowContext["customer"])
          : {})
      }
    };
  }

  if (job.action.type === "workflow.upsertOrder" || job.action.type === "workflow.createInvoice") {
    const orderPatch =
      typeof result.body === "object" && result.body !== null
        ? (result.body as Record<string, JsonValue>)
        : {};
    mergedContext = {
      ...mergedContext,
      order: {
        ...mergedContext.order,
        ...(orderPatch as WorkflowContext["order"])
      }
    };
  }

  if (job.action.type === "cryptopay.createInvoice") {
    const invoice =
      typeof result.body === "object" && result.body !== null
        ? (result.body as Record<string, JsonValue>)
        : {};
    const existingAttributes =
      mergedContext.order.attributes && typeof mergedContext.order.attributes === "object" && !Array.isArray(mergedContext.order.attributes)
        ? mergedContext.order.attributes
        : {};

    mergedContext = {
      ...mergedContext,
      order: {
        ...mergedContext.order,
        invoicePayload:
          typeof invoice.payload === "string"
            ? invoice.payload
            : mergedContext.order.invoicePayload,
        status: "awaiting_payment",
        attributes: {
          ...existingAttributes,
          cryptoPayInvoiceId: invoice.invoice_id ?? null,
          cryptoPayInvoiceHash: invoice.hash ?? null,
          cryptoPayInvoiceUrl: invoice.bot_invoice_url ?? invoice.pay_url ?? null,
          cryptoPayMiniAppInvoiceUrl: invoice.mini_app_invoice_url ?? null,
          cryptoPayWebAppInvoiceUrl: invoice.web_app_invoice_url ?? null,
          cryptoPayStatus: invoice.status ?? null,
          cryptoPayInvoice: invoice
        }
      }
    };
  }

  if (job.action.type === "workflow.orderTransition") {
    mergedContext = {
      ...mergedContext,
      order: {
        ...mergedContext.order,
        status: job.action.params.status
      }
    };
  }

  const resultRecord = buildResultRecord(result);
  mergedContext = {
    ...mergedContext,
    variables: {
      ...mergedContext.variables,
      [job.actionNodeId]: resultRecord
    }
  };
  const nodeKey = getNodeKey(job);
  if (nodeKey) {
    mergedContext = {
      ...mergedContext,
      variables: {
        ...mergedContext.variables,
        [nodeKey]: resultRecord
      }
    };
  }

  const persistedContext =
    "syncRuntimeState" in deps && typeof deps.syncRuntimeState === "function"
      ? await deps.syncRuntimeState({
          runId: job.runId,
          context: mergedContext
        })
      : mergedContext;
  await deps.updateWorkflowRunContext(job.runId, persistedContext);
  await deps.updateActionRun({
    actionRunId: job.actionRunId,
    status: "succeeded",
    attempt: attemptsStarted,
    lastError: null
  });

  if (isWaitingAction(job.action.type)) {
    const sessionId = persistedContext.session.id;
    if (!sessionId) {
      const wrapped = new Error("Waiting nodes require a persisted conversation session");
      (wrapped as Error & { classification?: WorkerFailureClass }).classification = "permanent";
      throw wrapped;
    }

    const timeoutMs = "timeout_ms" in job.action.params ? job.action.params.timeout_ms : undefined;
    const checkpoint = await deps.createCheckpoint({
      runId: job.runId,
      ruleId: job.ruleId,
      nodeId: job.actionNodeId,
      checkpointType: job.action.type,
      sessionId,
      metadata: buildCheckpointMetadata(job),
      expiresAt: typeof timeoutMs === "number" ? new Date(Date.now() + timeoutMs) : undefined
    });

    const waitingContext = {
      ...persistedContext,
      session: {
        ...persistedContext.session,
        checkpointId: checkpoint.checkpointId,
        status: persistedContext.session.status ?? "ACTIVE"
      }
    };
    await deps.updateWorkflowRunContext(job.runId, waitingContext);
    await deps.syncRuntimeState({
      runId: job.runId,
      context: waitingContext
    });
    await deps.updateWorkflowRunStatus(job.runId, "waiting");
    return;
  }

  const nextActions = getFrontierActions(job.flowDefinition, job.actionNodeId, job.event, persistedContext);
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
      botToken: job.botToken ?? null,
      cryptoPayToken: job.cryptoPayToken ?? null,
      cryptoPayUseTestnet: job.cryptoPayUseTestnet ?? false,
      idempotencyKey: `${job.event.eventId}:${nextRun.actionRunId}:${nextAction.payload.type}`,
      queueDelayMs: nextAction.payload.type === "workflow.delay" ? nextAction.payload.params.delay_ms : undefined,
      context: {
        ...job.context,
        runtime: persistedContext
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
