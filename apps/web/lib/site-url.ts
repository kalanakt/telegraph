const FALLBACK_SITE_URL = "https://telegraph.dev";

export function getSiteUrl() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? FALLBACK_SITE_URL;
  return candidate.replace(/\/$/, "");
}

export function toAbsoluteUrl(pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
