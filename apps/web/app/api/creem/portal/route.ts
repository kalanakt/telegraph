import { NextResponse } from "next/server";
import { createCreemCustomerPortalLink } from "@/lib/creem";
import { requireAppUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let user;
  try {
    user = await requireAppUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: { creemCustomerId: true }
  });

  if (!subscription?.creemCustomerId) {
    return NextResponse.json({ error: "No Creem customer linked yet" }, { status: 400 });
  }

  try {
    const url = await createCreemCustomerPortalLink(subscription.creemCustomerId);
    return NextResponse.redirect(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Portal link failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

