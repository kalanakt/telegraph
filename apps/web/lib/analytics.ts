export const ANALYTICS_CONSENT_COOKIE = "telegraph_analytics_consent";

export type AnalyticsConsent = "granted" | "denied" | "unknown";

export function getAnalyticsConsent(value: string | undefined): AnalyticsConsent {
  if (value === "granted" || value === "denied") {
    return value;
  }

  return "unknown";
}

export function isContentsquareEnabled() {
  const value = process.env.ENABLE_CONTENTSQUARE;
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

export function getContentsquareScriptUrl() {
  const siteId = process.env.CONTENTSQUARE_SITE_ID?.trim();
  if (!siteId) {
    return null;
  }

  return `https://t.contentsquare.net/uxa/${siteId}.js`;
}
