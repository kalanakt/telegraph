import { createAutomationOrchestrator, decrypt } from "@telegram-builder/shared";
import {
  createBullMqActionQueueAdapter,
  createPrismaBotRepository,
  createPrismaEntitlementPolicy,
  createPrismaEventRepository,
  createPrismaRuleRepository,
  createPrismaRunRepository
} from "./adapters";

let orchestrator: ReturnType<typeof createAutomationOrchestrator> | null = null;

export function getAutomationOrchestrator() {
  if (!orchestrator) {
    orchestrator = createAutomationOrchestrator({
      botRepository: createPrismaBotRepository(),
      ruleRepository: createPrismaRuleRepository(),
      eventRepository: createPrismaEventRepository(),
      runRepository: createPrismaRunRepository(),
      actionQueue: createBullMqActionQueueAdapter(),
      entitlementPolicy: createPrismaEntitlementPolicy(),
      decryptToken: decrypt
    });
  }

  return orchestrator;
}
