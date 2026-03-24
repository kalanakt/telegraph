import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "./auth-config";
import { syncSubscriptionMirrorForUser } from "./clerk-billing";
import { prisma } from "./prisma";

export async function requireAppUser() {
  if (!isClerkConfigured()) {
    return prisma.user.upsert({
      where: { clerkUserId: "local-dev-user" },
      create: {
        clerkUserId: "local-dev-user",
        email: "local-dev@example.com",
        subscription: {
          create: {
            plan: "FREE",
            status: "active"
          }
        }
      },
      update: {},
      include: {
        subscription: true
      }
    });
  }

  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();

  const user = await prisma.user.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      email: clerkUser?.primaryEmailAddress?.emailAddress,
      subscription: {
        create: {
          plan: "FREE",
          status: "active"
        }
      }
    },
    update: {
      email: clerkUser?.primaryEmailAddress?.emailAddress
    },
    include: {
      subscription: true
    }
  });

  await syncSubscriptionMirrorForUser({
    appUserId: user.id,
    clerkUserId: user.clerkUserId,
    fallbackPlan: user.subscription?.plan,
    fallbackStatus: user.subscription?.status
  });

  return prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    include: {
      subscription: true
    }
  });
}
