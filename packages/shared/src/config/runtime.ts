type EnvRecord = Record<string, string | undefined>;

export class RuntimeEnvError extends Error {
  readonly issues: string[];

  constructor(service: string, issues: string[]) {
    super(`[${service}] Invalid runtime environment: ${issues.join("; ")}`);
    this.name = "RuntimeEnvError";
    this.issues = issues;
  }
}

export function isTruthyEnv(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export function parseIntegerEnv(
  value: string | undefined,
  fallback: number,
  options?: { min?: number; max?: number }
): number {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (options?.min !== undefined && parsed < options.min) {
    return options.min;
  }

  if (options?.max !== undefined && parsed > options.max) {
    return options.max;
  }

  return parsed;
}

export function parseCsvEnv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function isProductionRuntime(env: EnvRecord = process.env): boolean {
  return env.NODE_ENV === "production";
}

export function hasAnyEnv(env: EnvRecord, names: string[]): boolean {
  return names.some((name) => Boolean(env[name]?.trim()));
}

export function hasAllEnv(env: EnvRecord, names: string[]): boolean {
  return names.every((name) => Boolean(env[name]?.trim()));
}

export function assertRuntimeEnv(
  service: string,
  env: EnvRecord,
  checks: Array<{
    name: string;
    required?: boolean;
    validate?: (value: string, env: EnvRecord) => string | null;
  }>
) {
  const issues: string[] = [];

  for (const check of checks) {
    const rawValue = env[check.name];
    const value = rawValue?.trim();

    if (check.required && !value) {
      issues.push(`${check.name} is required`);
      continue;
    }

    if (!value || !check.validate) {
      continue;
    }

    const validationIssue = check.validate(value, env);
    if (validationIssue) {
      issues.push(validationIssue);
    }
  }

  if (issues.length > 0) {
    throw new RuntimeEnvError(service, issues);
  }
}

export function validateUrlEnv(name: string, value: string): string | null {
  try {
    new URL(value);
    return null;
  } catch {
    return `${name} must be a valid URL`;
  }
}
