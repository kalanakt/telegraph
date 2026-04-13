import { getPathValue, setPathValue } from "./object-path.js";
import type {
  CommerceOrderState,
  CustomerProfileState,
  JsonValue,
  WorkflowContext,
  ConversationSessionState
} from "../types/workflow.js";

function asRecord(value: unknown): Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, JsonValue>)
    : {};
}

export function createEmptyWorkflowContext(input?: Partial<WorkflowContext>): WorkflowContext {
  return {
    variables: { ...(input?.variables ?? {}) },
    session: { ...(input?.session ?? {}) },
    customer: { ...(input?.customer ?? {}) },
    order: { ...(input?.order ?? {}) }
  };
}

export function getContextScopeValue(context: WorkflowContext, path: string): JsonValue | undefined {
  if (path === "vars") return context.variables;
  if (path === "session") return context.session as JsonValue;
  if (path === "customer") return context.customer as JsonValue;
  if (path === "order") return context.order as JsonValue;

  if (path.startsWith("vars.")) {
    return getPathValue(context.variables, path.replace(/^vars\./, "")) as JsonValue | undefined;
  }

  if (path.startsWith("session.")) {
    return getPathValue(context.session, path.replace(/^session\./, "")) as JsonValue | undefined;
  }

  if (path.startsWith("customer.")) {
    return getPathValue(context.customer, path.replace(/^customer\./, "")) as JsonValue | undefined;
  }

  if (path.startsWith("order.")) {
    return getPathValue(context.order, path.replace(/^order\./, "")) as JsonValue | undefined;
  }

  return undefined;
}

export function setContextScopeValue(context: WorkflowContext, path: string, value: JsonValue): WorkflowContext {
  if (path.startsWith("session.")) {
    return {
      ...context,
      session: setPathValue(asRecord(context.session), path.replace(/^session\./, ""), value) as ConversationSessionState
    };
  }

  if (path.startsWith("customer.")) {
    return {
      ...context,
      customer: setPathValue(asRecord(context.customer), path.replace(/^customer\./, ""), value) as CustomerProfileState
    };
  }

  if (path.startsWith("order.")) {
    return {
      ...context,
      order: setPathValue(asRecord(context.order), path.replace(/^order\./, ""), value) as CommerceOrderState
    };
  }

  return {
    ...context,
    variables: setPathValue(context.variables, path.replace(/^vars\./, ""), value)
  };
}
