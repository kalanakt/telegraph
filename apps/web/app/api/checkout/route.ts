import { Checkout } from "@creem_io/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/clerk-auth";
import { getCreemApiKey, getCreemProProductId, isCreemTestMode } from "@/lib/creem";
import { requireAppUser } from "@/lib/user";

const checkoutHandler = Checkout({
  apiKey: getCreemApiKey(),
  testMode: isCreemTestMode(),
  defaultSuccessUrl: "/account"
});

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId();

  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", "/pricing");
    return NextResponse.redirect(signInUrl);
  }

  const appUser = await requireAppUser();
  const productId = getCreemProProductId();

  if (!productId) {
    return NextResponse.json({ error: "Missing CREEM_PRO_PRODUCT_ID" }, { status: 500 });
  }

  if (!appUser.email) {
    const accountUrl = new URL("/account", req.url);
    accountUrl.searchParams.set("billing", "missing-email");
    return NextResponse.redirect(accountUrl);
  }

  const checkoutUrl = new URL(req.url);
  checkoutUrl.search = new URLSearchParams({
    customer: JSON.stringify({ email: appUser.email }),
    metadata: JSON.stringify({
      appUserId: appUser.id,
      clerkUserId: appUser.clerkUserId,
      source: "telegraph-account"
    }),
    productId,
    referenceId: appUser.id,
    successUrl: "/account"
  }).toString();

  return checkoutHandler(new NextRequest(checkoutUrl, { headers: req.headers }));
}
