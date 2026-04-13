import { createAutomationOrchestrator, decrypt } from "@telegram-builder/shared";
import {
  createBullMqActionQueueAdapter,
  createPrismaBotRepository,
  createPrismaBotUserRepository,
  createPrismaEntitlementPolicy,
  createPrismaEventRepository,
  createPrismaRuntimeRepository,
  createPrismaRuleRepository,
  createPrismaRunRepository
} from "./adapters";

let orchestrator: ReturnType<typeof createAutomationOrchestrator> | null = null;

export function getAutomationOrchestrator() {
  if (!orchestrator) {
    orchestrator = createAutomationOrchestrator({
      botRepository: createPrismaBotRepository(),
      botUserRepository: createPrismaBotUserRepository(),
      ruleRepository: createPrismaRuleRepository(),
      eventRepository: createPrismaEventRepository(),
      runRepository: createPrismaRunRepository(),
      runtimeRepository: createPrismaRuntimeRepository(),
      actionQueue: createBullMqActionQueueAdapter(),
      entitlementPolicy: createPrismaEntitlementPolicy(),
      decryptToken: decrypt
    });
  }

  return orchestrator;
}
