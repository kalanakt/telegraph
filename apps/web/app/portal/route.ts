import { Portal } from "@creem_io/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/clerk-auth";
import { requireAppUser } from "@/lib/user";
import { getCreemApiKey, isCreemTestMode } from "@/lib/creem";

const portalHandler = Portal({
  apiKey: getCreemApiKey(),
  testMode: isCreemTestMode()
});

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", "/account");
    return NextResponse.redirect(signInUrl);
  }

  const appUser = await requireAppUser();
  const customerId = appUser.subscription?.creemCustomerId;

  if (!customerId) {
    const accountUrl = new URL("/account", req.url);
    accountUrl.searchParams.set("billing", "portal-unavailable");
    return NextResponse.redirect(accountUrl);
  }

  const portalUrl = new URL(req.url);
  portalUrl.search = new URLSearchParams({
    customerId
  }).toString();

  return portalHandler(new NextRequest(portalUrl, { headers: req.headers }));
}
