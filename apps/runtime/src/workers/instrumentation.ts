import { jobDurationSeconds, jobProcessedTotal } from "@telegraph/telemetry";
import type { Processor } from "bullmq";

interface LoggerLike {
  error: (obj: Record<string, unknown>, message: string) => void;
}

export function instrumentProcessor<T>(
  queue: string,
  logger: LoggerLike,
  processor: Processor<T>,
): Processor<T> {
  return async (job, token) => {
    const start = process.hrtime.bigint();
    try {
      const result = await processor(job, token);
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
      jobDurationSeconds.observe({ queue }, durationSeconds);
      jobProcessedTotal.inc({ queue, status: "success" });
      return result;
    } catch (error) {
      const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
      jobDurationSeconds.observe({ queue }, durationSeconds);
      jobProcessedTotal.inc({ queue, status: "error" });
      logger.error({ queue, jobId: job.id, error }, "Worker job failed");
      throw error;
    }
  };
}
