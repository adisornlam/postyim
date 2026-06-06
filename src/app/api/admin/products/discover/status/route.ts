import { NextResponse } from "next/server";

import { getDiscoveryJobStatus } from "@/lib/ai/discover-products-job";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function GET(request: Request) {
  const unauthorized = await requireAdminSession();

  if (unauthorized) {
    return unauthorized;
  }

  const jobRunId = new URL(request.url).searchParams.get("jobRunId");

  if (!jobRunId) {
    return NextResponse.json({ error: "jobRunId is required" }, { status: 400 });
  }

  const status = await getDiscoveryJobStatus(jobRunId);

  if (!status) {
    return NextResponse.json({ error: "Discovery job not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: "ok",
    job: {
      jobRunId: status.jobRunId,
      state: status.invalid ? "failed" : status.status,
      durationMs: status.durationMs,
      output: status.output,
      error: status.error,
      progress: status.progress,
      logs: status.logs,
    },
  });
}
