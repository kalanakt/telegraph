import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAppUser } from "@/lib/user";

export async function GET(_: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const user = await requireAppUser();
    const { orderId } = await context.params;

    const order = await prisma.commerceOrder.findFirst({
      where: {
        id: orderId,
        bot: { userId: user.id },
      },
      include: {
        customerProfile: true,
        session: true,
        workflowRuns: {
          orderBy: { createdAt: "desc" },
          take: 25,
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
