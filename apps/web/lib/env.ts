function isTruthyEnv(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

function isProductionRuntime(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV === "production";
}

function parseCsvEnv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function validateUrlEnv(name: string, value: string) {
  try {
    new URL(value);
    return null;
  } catch {
    return `${name} must be a valid URL`;
  }
}

function hasAllEnv(env: NodeJS.ProcessEnv, names: string[]) {
  return names.every((name) => Boolean(env[name]?.trim()));
}

function assertRuntimeEnv(
  service: string,
  env: NodeJS.ProcessEnv,
  checks: Array<{
    name: string;
    required?: boolean;
    validate?: (value: string) => string | null;
  }>
) {
  const issues: string[] = [];

  for (const check of checks) {
    const value = env[check.name]?.trim();

    if (check.required && !value) {
      issues.push(`${check.name} is required`);
      continue;
    }

    if (!value || !check.validate) {
      continue;
    }

    const issue = check.validate(value);
    if (issue) {
      issues.push(issue);
    }
  }

  if (issues.length > 0) {
    throw new Error(`[${service}] Invalid runtime environment: ${issues.join("; ")}`);
  }
}

type WebRuntimeEnv = {
  isProduction: boolean;
  billingEnabled: boolean;
  contentsquareEnabled: boolean;
  mediaUploadsEnabled: boolean;
  operatorEmails: string[];
};

let cachedEnv: WebRuntimeEnv | null = null;

function validateWebRuntimeEnv() {
  const env = process.env;
  const isProduction = isProductionRuntime(env);
  const mediaUploadsEnabled = isTruthyEnv(env.ENABLE_MEDIA_UPLOADS);
  const contentsquareEnabled = isTruthyEnv(env.ENABLE_CONTENTSQUARE);
  const billingEnabled = true;

  assertRuntimeEnv("web", env, [
    { name: "DATABASE_URL", required: true },
    { name: "REDIS_URL", required: true },
    {
      name: "ENCRYPTION_KEY",
      required: true,
      validate: (value: string) => (value.length < 32 ? "ENCRYPTION_KEY must be at least 32 characters" : null)
    },
    {
      name: "TELEGRAM_WEBHOOK_BASE_URL",
      required: true,
      validate: (value: string) => validateUrlEnv("TELEGRAM_WEBHOOK_BASE_URL", value)
    },
    {
      name: "NEXT_PUBLIC_SITE_URL",
      required: true,
      validate: (value: string) => validateUrlEnv("NEXT_PUBLIC_SITE_URL", value)
    },
    { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", required: isProduction },
    { name: "CLERK_SECRET_KEY", required: isProduction },
    { name: "CREEM_API_KEY", required: billingEnabled && isProduction },
    { name: "CREEM_WEBHOOK_SECRET", required: billingEnabled && isProduction },
    { name: "CREEM_PRO_MONTHLY_PRODUCT_ID", required: billingEnabled && isProduction },
    { name: "CREEM_PRO_YEARLY_PRODUCT_ID", required: billingEnabled && isProduction },
    { name: "TELEGRAM_WEBHOOK_SECRET_TOKEN", required: isProduction },
    { name: "S3_ENDPOINT", required: mediaUploadsEnabled },
    { name: "S3_BUCKET", required: mediaUploadsEnabled },
    { name: "S3_ACCESS_KEY_ID", required: mediaUploadsEnabled },
    { name: "S3_SECRET_ACCESS_KEY", required: mediaUploadsEnabled },
    {
      name: "S3_PUBLIC_URL",
      required: false,
      validate: (value: string) => validateUrlEnv("S3_PUBLIC_URL", value)
    },
    {
      name: "CONTENTSQUARE_SITE_ID",
      required: contentsquareEnabled,
      validate: (value: string) => (value.length < 6 ? "CONTENTSQUARE_SITE_ID must look like a valid site id" : null)
    }
  ]);

  if (mediaUploadsEnabled && !hasAllEnv(env, ["S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"])) {
    throw new Error("[web] Invalid runtime environment: media uploads are enabled but S3 credentials are incomplete");
  }

  return {
    isProduction,
    billingEnabled,
    contentsquareEnabled,
    mediaUploadsEnabled,
    operatorEmails: parseCsvEnv(env.OPERATOR_EMAILS).map((email: string) => email.toLowerCase())
  } satisfies WebRuntimeEnv;
}

export function getWebRuntimeEnv(): WebRuntimeEnv {
  if (!cachedEnv) {
    cachedEnv = validateWebRuntimeEnv();
  }

  return cachedEnv;
}

export function areOperatorEmailsConfigured() {
  return getWebRuntimeEnv().operatorEmails.length > 0;
}

export function resetWebRuntimeEnvForTests() {
  cachedEnv = null;
}
