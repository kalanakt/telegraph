import type { PrismaClient } from "@prisma/client";
import type { Queue } from "bullmq";
import { logError, logInfo } from "@telegram-builder/shared";

type RetentionConfig = {
  deadLetterRetentionDays: number;
  incomingEventRetentionDays: number;
  intervalMinutes: number;
  runRetentionDays: number;
};

const QUEUE_CLEANUP_STATUSES = ["wait", "delayed", "failed", "paused", "completed"] as const;

function subtractDays(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

async function cleanQueueByAge(queue: Queue, retentionDays: number) {
  const graceMs = retentionDays * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const status of QUEUE_CLEANUP_STATUSES) {
    while (true) {
      const ids = await queue.clean(graceMs, 1000, status);
      removed += ids.length;

      if (ids.length < 1000) {
        break;
      }
    }
  }

  return removed;
}

async function runRetentionSweep(prisma: PrismaClient, deadLetterQueue: Queue, config: RetentionConfig) {
  const incomingCutoff = subtractDays(config.incomingEventRetentionDays);
  const runCutoff = subtractDays(config.runRetentionDays);

  const [incomingDeleted, workflowRunsDeleted, deadLetterRemoved] = await Promise.all([
    prisma.incomingEvent.deleteMany({
      where: {
        createdAt: {
          lt: incomingCutoff
        }
      }
    }),
    prisma.workflowRun.deleteMany({
      where: {
        createdAt: {
          lt: runCutoff
        }
      }
    }),
    cleanQueueByAge(deadLetterQueue, config.deadLetterRetentionDays)
  ]);

  logInfo("retention_sweep_completed", {
    deadLetterRemoved,
    incomingEventsDeleted: incomingDeleted.count,
    route: "worker-retention",
    workflowRunsDeleted: workflowRunsDeleted.count
  });
}

export function startRetentionSweeper(prisma: PrismaClient, deadLetterQueue: Queue, config: RetentionConfig) {
  let timer: NodeJS.Timeout | null = null;

  const run = async () => {
    try {
      await runRetentionSweep(prisma, deadLetterQueue, config);
    } catch (error) {
      logError("retention_sweep_failed", {
        error,
        route: "worker-retention"
      });
    }
  };

  void run();

  timer = setInterval(() => {
    void run();
  }, config.intervalMinutes * 60 * 1000);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}
