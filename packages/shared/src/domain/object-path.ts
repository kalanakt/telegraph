import type { JsonValue } from "../types/workflow.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJsonObject(input: Record<string, JsonValue>): Record<string, JsonValue> {
  return JSON.parse(JSON.stringify(input)) as Record<string, JsonValue>;
}

export function getPathValue(input: unknown, path: string): unknown {
  if (!path.trim()) {
    return input;
  }

  const parts = path
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);

  let current: unknown = input;
  for (const part of parts) {
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index)) {
        return undefined;
      }
      current = current[index];
      continue;
    }

    if (!isRecord(current)) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

export function toTemplateString(value: unknown): string {
  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

export function asJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => asJsonValue(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, asJsonValue(nested)])
    );
  }

  return String(value);
}

export function normalizeHeaderLookup(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

export function setPathValue(
  input: Record<string, JsonValue>,
  path: string,
  value: JsonValue
): Record<string, JsonValue> {
  const next = cloneJsonObject(input);
  const parts = path
    .split(".")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return next;
  }

  let cursor: Record<string, JsonValue> = next;

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (!part) {
      continue;
    }

    if (index === parts.length - 1) {
      cursor[part] = value;
      break;
    }

    const current = cursor[part];
    if (typeof current === "object" && current !== null && !Array.isArray(current)) {
      cursor = current as Record<string, JsonValue>;
      continue;
    }

    cursor[part] = {};
    cursor = cursor[part] as Record<string, JsonValue>;
  }

  return next;
}
