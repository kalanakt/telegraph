import { PLAN_LIMITS, normalizePlanKey, type PlanKey } from "@telegram-builder/shared";
import { prisma } from "./prisma";

export async function getUserPlan(user: {
  id: string;
  clerkUserId: string;
  subscription?: { plan?: string | null; status?: string | null } | null;
}): Promise<PlanKey> {
  return normalizePlanKey(user.subscription?.plan);
}

export async function assertBotLimit(userId: string, plan: PlanKey) {
  const botCount = await prisma.bot.count({ where: { userId } });
  if (botCount >= PLAN_LIMITS[plan].maxBots) {
    throw new Error(`Bot limit reached for ${plan} plan`);
  }
}

export async function assertRuleLimit(userId: string, botId: string, plan: PlanKey) {
  const bot = await prisma.bot.findFirst({
    where: {
      id: botId,
      userId
    }
  });

  if (!bot) {
    throw new Error("Bot not found");
  }

  const ruleCount = await prisma.workflowRule.count({
    where: {
      userId,
      botId
    }
  });

  if (ruleCount >= PLAN_LIMITS[plan].maxRulesPerBot) {
    throw new Error(`Rule limit reached for ${plan} plan`);
  }
}

export async function getRemainingRuleCapacity(userId: string, botId: string, plan: PlanKey) {
  const bot = await prisma.bot.findFirst({
    where: {
      id: botId,
      userId
    }
  });

  if (!bot) {
    throw new Error("Bot not found");
  }

  const ruleCount = await prisma.workflowRule.count({
    where: {
      userId,
      botId
    }
  });

  return Math.max(PLAN_LIMITS[plan].maxRulesPerBot - ruleCount, 0);
}

export async function isMonthlyExecutionExceeded(userId: string, plan: PlanKey) {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);

  const next = new Date(start);
  next.setUTCMonth(next.getUTCMonth() + 1);

  const count = await prisma.workflowRun.count({
    where: {
      userId,
      createdAt: {
        gte: start,
        lt: next
      }
    }
  });

  return count >= PLAN_LIMITS[plan].monthlyExecutions;
}
