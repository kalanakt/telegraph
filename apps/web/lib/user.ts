import { getAuthUserId, getCurrentUserOrNull } from "./clerk-auth";
import { prisma } from "./prisma";

const subscriptionSelect = {
  select: {
    creemCustomerId: true,
    currentPeriodEnd: true,
    plan: true,
    status: true
  }
} as const;

async function upsertUserAndEnsureSubscription(params: {
  clerkUserId: string;
  email?: string;
}) {
  const { clerkUserId, email } = params;

  // Avoid interactive transactions here (this runs on most dashboard pages),
  // since connection pools / pgbouncer can cause "Unable to start a transaction"
  // under load. Two independent native upserts are sufficient and idempotent.
  const user = await prisma.user.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email
    },
    update: {
      email
    }
  });

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      plan: "FREE",
      status: "inactive"
    },
    update: {}
  });

  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      subscription: subscriptionSelect
    }
  });
}

export async function requireAppUser() {
  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await getCurrentUserOrNull();

  const user = await upsertUserAndEnsureSubscription({
    clerkUserId: userId,
    email: clerkUser?.primaryEmailAddress?.emailAddress
  });

  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      subscription: subscriptionSelect
    }
  });
}
