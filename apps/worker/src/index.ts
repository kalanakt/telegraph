import { captureWorkerException, flushSentry } from "./sentry.js";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { QUEUES, getExecutionPolicy, logError, logInfo, logWarn, type ActionJob } from "@telegram-builder/shared";
import { handleActionJobFailure, processActionJob, type WorkerProcessorDeps, workerTelegramDeps } from "./processor.js";
import { getWorkerRuntimeEnv, type WorkerRuntimeEnv } from "./env.js";
import { startRetentionSweeper } from "./retention.js";

let workerEnv: WorkerRuntimeEnv;

try {
  workerEnv = getWorkerRuntimeEnv();
} catch (error) {
  captureWorkerException(error, {
    tags: {
      area: "boot-config",
      service: "worker"
    }
  });
  throw error;
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is required");
}

const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const prisma = new PrismaClient();
const actionQueue = new Queue(QUEUES.ACTIONS, { connection: redis });
const deadLetterQueue = new Queue(QUEUES.DEAD_LETTER, { connection: redis });
const stopRetentionSweeper = startRetentionSweeper(prisma, deadLetterQueue, {
  deadLetterRetentionDays: workerEnv.deadLetterRetentionDays,
  incomingEventRetentionDays: workerEnv.incomingEventRetentionDays,
  intervalMinutes: workerEnv.retentionSweepIntervalMinutes,
  runRetentionDays: workerEnv.runRetentionDays
});

const deps: WorkerProcessorDeps = {
  async updateActionRun(input) {
    await prisma.actionRun.update({
      where: { id: input.actionRunId },
      data: {
        status: input.status,
        attempt: input.attempt,
        lastError: input.lastError ?? undefined
      }
    });
  },
  async countActionRunsByStatus(runId, status) {
    return prisma.actionRun.count({
      where: {
        workflowRunId: runId,
        status
      }
    });
  },
  async updateWorkflowRunStatus(runId, status) {
    await prisma.workflowRun.update({
      where: { id: runId },
      data: { status }
    });
  },
  async getWorkflowRunContext(runId) {
    const run = await prisma.workflowRun.findUnique({
      where: { id: runId },
      select: { contextVariables: true }
    });

    return ((run?.contextVariables as Record<string, unknown> | null) ?? {}) as Record<string, string | number | boolean | null>;
  },
  async updateWorkflowRunContext(runId, variables) {
    await prisma.workflowRun.update({
      where: { id: runId },
      data: { contextVariables: variables as never }
    });
  },
  async getOrCreateActionRun(input) {
    try {
      const created = await prisma.actionRun.create({
        data: {
          workflowRunId: input.runId,
          actionId: input.actionId,
          type: input.action.type,
          payload: {
            ...input.action,
            executionPolicy: getExecutionPolicy(input.action.type)
          } as never,
          status: "pending"
        }
      });

      return { actionRunId: created.id, created: true };
    } catch (error) {
      const existing = await prisma.actionRun.findFirstOrThrow({
        where: {
          workflowRunId: input.runId,
          actionId: input.actionId
        },
        select: { id: true }
      });

      return { actionRunId: existing.id, created: false };
    }
  },
  async enqueueAction(job) {
    await actionQueue.add(`action:${job.actionType}`, job, {
      jobId: job.idempotencyKey,
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: false
    });
  },
  async enqueueDeadLetter(input) {
    try {
      await deadLetterQueue.add("failed-action", input);
      logWarn("dead_letter_enqueued", {
        actionRunId: input.job.actionRunId,
        classification: input.classification,
        code: input.code,
        queue: QUEUES.DEAD_LETTER,
        route: "worker-dead-letter",
        runId: input.job.runId
      });
    } catch (error) {
      captureWorkerException(error, {
        tags: {
          area: "dead-letter-write",
          queue: QUEUES.DEAD_LETTER
        }
      });
      throw error;
    }
  },
  ...workerTelegramDeps
};

const worker = new Worker<ActionJob>(
  QUEUES.ACTIONS,
  async (job) => {
    await processActionJob(deps, job.data, job.attemptsStarted);
  },
  {
    connection: redis,
    concurrency: workerEnv.concurrency
  }
);

worker.on("failed", async (job, err) => {
  if (!job) {
    return;
  }

  const error = err as Error & { code?: number; classification?: "transient" | "permanent" };
  captureWorkerException(error, {
    tags: {
      area: "worker-job",
      queue: QUEUES.ACTIONS,
    },
    extra: {
      actionRunId: job.data.actionRunId,
      runId: job.data.runId,
      actionType: job.data.action.type,
      attemptsMade: job.attemptsMade,
      attemptsStarted: job.attemptsStarted,
    },
  });

  await handleActionJobFailure(
    deps,
    job.data,
    job.attemptsMade,
    job.opts.attempts ?? 1,
    error.message,
    error.classification ?? "transient",
    error.code
  );
});

worker.on("ready", () => {
  logInfo("worker_ready", {
    concurrency: workerEnv.concurrency,
    queue: QUEUES.ACTIONS,
    route: "worker-runtime"
  });
});

worker.on("error", (error) => {
  captureWorkerException(error, {
    tags: {
      area: "worker-runtime",
      queue: QUEUES.ACTIONS,
    },
  });
  logError("worker_runtime_error", {
    error,
    queue: QUEUES.ACTIONS,
    route: "worker-runtime"
  });
});

async function shutdown(signal: string) {
  logInfo("worker_shutdown_started", {
    queue: QUEUES.ACTIONS,
    route: "worker-runtime",
    signal
  });

  stopRetentionSweeper();
  await worker.close();
  await actionQueue.close();
  await deadLetterQueue.close();
  await prisma.$disconnect();
  await redis.quit();
  await flushSentry();
}

process.on("SIGINT", () => {
  void shutdown("SIGINT").finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM").finally(() => process.exit(0));
});
