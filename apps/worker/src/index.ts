import { captureWorkerException, flushSentry } from "./sentry.js";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { QUEUES, type ActionJob } from "@telegram-builder/shared";
import { handleActionJobFailure, processActionJob, type WorkerProcessorDeps, workerTelegramDeps } from "./processor.js";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is required");
}

const redis = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const prisma = new PrismaClient();
const deadLetterQueue = new Queue(QUEUES.DEAD_LETTER, { connection: redis });

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
  async enqueueDeadLetter(input) {
    await deadLetterQueue.add("failed-action", input);
  },
  ...workerTelegramDeps
};

const worker = new Worker<ActionJob>(
  QUEUES.ACTIONS,
  async (job) => {
    await processActionJob(deps, job.data, job.attemptsStarted);
  },
  { connection: redis }
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
  console.log("Action worker is ready");
});

worker.on("error", (error) => {
  captureWorkerException(error, {
    tags: {
      area: "worker-runtime",
      queue: QUEUES.ACTIONS,
    },
  });
  console.error("Worker error", error);
});

async function shutdown(signal: string) {
  console.log(`Shutting down action worker on ${signal}`);

  await worker.close();
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
