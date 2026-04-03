import { NextResponse } from "next/server";
import { requireOperatorUser } from "@/lib/user";
import { getDeadLetterQueue } from "@/lib/queue";

export async function GET() {
  try {
    await requireOperatorUser();

    const queue = getDeadLetterQueue();
    const [counts, jobs] = await Promise.all([
      queue.getJobCounts("wait", "delayed", "failed", "paused"),
      queue.getJobs(["wait", "delayed", "failed", "paused"], 0, 19, true)
    ]);

    return NextResponse.json({
      ok: true,
      counts,
      jobs: jobs.map((job) => ({
        id: job.id,
        name: job.name,
        timestamp: job.timestamp,
        actionRunId: job.data?.job?.actionRunId ?? null,
        actionType: job.data?.metadata?.actionType ?? null,
        classification: job.data?.classification ?? null,
        code: job.data?.code ?? null,
        error: job.data?.error ?? null,
        runId: job.data?.job?.runId ?? null,
        trigger: job.data?.metadata?.trigger ?? null,
        updateId: job.data?.metadata?.updateId ?? null
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to load dead letters" }, { status: 500 });
  }
}
