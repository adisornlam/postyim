import { NextResponse } from "next/server";
import { z } from "zod";

import { runDiscoveryJobRun } from "@/lib/ai/discover-products-job";
import {
  unauthorizedJobResponse,
  verifyJobAuth,
} from "@/lib/jobs/auth";

export const maxDuration = 300;

const runSchema = z.object({
  jobRunId: z.string().uuid(),
});

export async function POST(request: Request) {
  if (!(await verifyJobAuth(request))) {
    return unauthorizedJobResponse();
  }

  try {
    const body = runSchema.parse(await request.json());
    const output = await runDiscoveryJobRun(body.jobRunId);

    return NextResponse.json({ status: "ok", output });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Product discovery failed";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
