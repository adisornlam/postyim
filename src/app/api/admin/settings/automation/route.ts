import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { upsertSecretIfProvided } from "@/lib/settings/app-settings";
import { SETTING_KEYS } from "@/lib/settings/keys";
import { getAutomationSettingsSummary } from "@/lib/settings/runtime-config";

const automationSchema = z.object({
  cronSecret: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireSuperAdminSession();
  if (auth.response || !auth.session) {
    return auth.response;
  }

  const parsed = automationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
      { status: 400 },
    );
  }

  await upsertSecretIfProvided({
    key: SETTING_KEYS.automation.cronSecret,
    category: "automation",
    value: parsed.data.cronSecret,
    updatedBy: auth.session.userId,
  });

  return NextResponse.json({
    ok: true,
    summary: await getAutomationSettingsSummary(),
  });
}
