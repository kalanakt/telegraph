import { cookies } from "next/headers";
import { ANALYTICS_CONSENT_COOKIE, getAnalyticsConsent } from "@/lib/analytics";

export async function getServerAnalyticsConsent() {
  const cookieStore = await cookies();
  return getAnalyticsConsent(cookieStore.get(ANALYTICS_CONSENT_COOKIE)?.value);
}
