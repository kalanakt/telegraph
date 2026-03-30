import { NextResponse } from "next/server";
import { createCreemCheckout } from "@/lib/creem";
import { requireAppUser } from "@/lib/user";
import { toAbsoluteUrl } from "@/lib/site-url";

export async function GET(req: Request) {
  let user;
  try {
    user = await requireAppUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const plan = (url.searchParams.get("plan") ?? "pro").toLowerCase();

  if (plan !== "pro") {
    return NextResponse.json({ error: "Unsupported plan" }, { status: 400 });
  }

  const productId = process.env.CREEM_PRO_PRODUCT_ID;
  if (!productId) {
    return NextResponse.json({ error: "CREEM_PRO_PRODUCT_ID is required" }, { status: 500 });
  }

  try {
    const checkout = await createCreemCheckout({
      productId,
      requestId: `user_${user.id}_${Date.now()}`,
      successUrl: toAbsoluteUrl("/account?billing=success"),
      customerEmail: user.email ?? undefined,
      metadata: {
        referenceId: user.id
      }
    });

    return NextResponse.redirect(checkout.checkout_url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

