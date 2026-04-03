type LogValue = unknown;

type LogData = Record<string, LogValue>;

function normalizeValue(value: unknown): LogValue {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [key, normalizeValue(nested)])
    );
  }

  return value;
}

function emit(level: "info" | "warn" | "error", event: string, data: LogData = {}) {
  const normalizedData = normalizeValue(data);
  const entry = JSON.stringify({
    level,
    event,
    ts: new Date().toISOString(),
    ...(normalizedData && typeof normalizedData === "object" && !Array.isArray(normalizedData) ? normalizedData : {})
  });

  if (level === "error") {
    console.error(entry);
    return;
  }

  if (level === "warn") {
    console.warn(entry);
    return;
  }

  console.log(entry);
}

export function logInfo(event: string, data: LogData = {}) {
  emit("info", event, data);
}

export function logWarn(event: string, data: LogData = {}) {
  emit("warn", event, data);
}

export function logError(event: string, data: LogData = {}) {
  emit("error", event, data);
}
