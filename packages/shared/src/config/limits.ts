export type PlanKey = "FREE" | "PRO";

export type PlanLimit = {
  maxBots: number;
  maxRulesPerBot: number;
  monthlyExecutions: number;
};

export const PLAN_LIMITS: Record<PlanKey, PlanLimit> = {
  FREE: {
    maxBots: 1,
    maxRulesPerBot: 3,
    monthlyExecutions: 1000
  },
  PRO: {
    maxBots: 20,
    maxRulesPerBot: 100,
    monthlyExecutions: 200000
  }
};

export function normalizePlanKey(plan?: string | null): PlanKey {
  return plan === "PRO" ? "PRO" : "FREE";
}
