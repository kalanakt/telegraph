import { isClerkConfigured } from "./auth-config";
import { getAuthUserId, getCurrentUserOrNull } from "./clerk-auth";
import { prisma } from "./prisma";

const subscriptionSelect = {
  select: {
    plan: true,
    status: true
  }
} as const;

async function upsertUserAndEnsureSubscription(params: {
  clerkUserId: string;
  email?: string;
}) {
  const { clerkUserId, email } = params;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { clerkUserId },
      create: {
        clerkUserId,
        email
      },
      update: {
        email
      }
    });

    // Avoid nested writes inside `user.upsert()` so Prisma can use a native upsert
    // and we don't trip over concurrent requests (e.g. Next.js dev double-renders).
    await tx.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: "FREE",
        status: "active"
      },
      update: {}
    });

    return tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        subscription: subscriptionSelect
      }
    });
  });
}

export async function requireAppUser() {
  if (!isClerkConfigured()) {
    return upsertUserAndEnsureSubscription({
      clerkUserId: "local-dev-user",
      email: "local-dev@example.com"
    });
  }

  const userId = await getAuthUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await getCurrentUserOrNull();

  return upsertUserAndEnsureSubscription({
    clerkUserId: userId,
    email: clerkUser?.primaryEmailAddress?.emailAddress
  });
}
