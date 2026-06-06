import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { createAmazonPaapiClient } from "@/lib/affiliate/adapters/amazon/client";
import { resetGeminiClient } from "@/lib/ai/gemini/client";
import {
  upsertSecretIfProvided,
  upsertSetting,
} from "@/lib/settings/app-settings";
import { SETTING_KEYS } from "@/lib/settings/keys";
import {
  getAmazonSettingsSummary,
  getAutomationSettingsSummary,
  getGeminiSettingsSummary,
  shouldUseAmazonMock,
  shouldUseGeminiMock,
} from "@/lib/settings/runtime-config";

const amazonSchema = z.object({
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  partnerTag: z.string().min(1, "Partner tag is required"),
  region: z.string().min(1, "Region is required"),
  useMock: z.boolean(),
});

const geminiSchema = z.object({
  apiKey: z.string().optional(),
  modelDraft: z.string().min(1),
  modelFinal: z.string().min(1),
  useMock: z.boolean(),
});

const automationSchema = z.object({
  cronSecret: z.string().optional(),
});

export async function GET() {
  const auth = await requireSuperAdminSession();
  if (auth.response) {
    return auth.response;
  }

  const [amazon, gemini, automation] = await Promise.all([
    getAmazonSettingsSummary(),
    getGeminiSettingsSummary(),
    getAutomationSettingsSummary(),
  ]);

  return NextResponse.json({ amazon, gemini, automation });
}

export async function POST(request: Request) {
  const auth = await requireSuperAdminSession();
  if (auth.response || !auth.session) {
    return auth.response;
  }

  const body = await request.json();
  const provider = body?.provider as string | undefined;

  if (provider === "amazon") {
    const parsed = amazonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    const { accessKey, secretKey, partnerTag, region, useMock } = parsed.data;
    const updatedBy = auth.session.userId;
    const summary = await getAmazonSettingsSummary();

    if (!useMock) {
      const hasAccessKey = Boolean(accessKey?.trim()) || summary.hasAccessKey;
      const hasSecretKey = Boolean(secretKey?.trim()) || summary.hasSecretKey;

      if (!hasAccessKey || !hasSecretKey || !partnerTag.trim()) {
        return NextResponse.json(
          {
            error:
              "Live Amazon mode requires access key, secret key, and partner tag.",
          },
          { status: 400 },
        );
      }
    }

    await upsertSetting({
      key: SETTING_KEYS.amazon.mock,
      category: "integration",
      valueType: "boolean",
      value: useMock,
      updatedBy,
    });

    await upsertSetting({
      key: SETTING_KEYS.amazon.partnerTag,
      category: "integration",
      valueType: "string",
      value: partnerTag,
      updatedBy,
    });

    await upsertSetting({
      key: SETTING_KEYS.amazon.region,
      category: "integration",
      valueType: "string",
      value: region,
      updatedBy,
    });

    await upsertSecretIfProvided({
      key: SETTING_KEYS.amazon.accessKey,
      category: "integration",
      value: accessKey,
      updatedBy,
    });

    await upsertSecretIfProvided({
      key: SETTING_KEYS.amazon.secretKey,
      category: "integration",
      value: secretKey,
      updatedBy,
    });

    return NextResponse.json({
      ok: true,
      summary: await getAmazonSettingsSummary(),
    });
  }

  if (provider === "gemini") {
    const parsed = geminiSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload" },
        { status: 400 },
      );
    }

    const { apiKey, modelDraft, modelFinal, useMock } = parsed.data;
    const updatedBy = auth.session.userId;
    const summary = await getGeminiSettingsSummary();

    if (!useMock && !apiKey?.trim() && !summary.hasApiKey) {
      return NextResponse.json(
        { error: "Live Gemini mode requires an API key." },
        { status: 400 },
      );
    }

    await upsertSetting({
      key: SETTING_KEYS.gemini.mock,
      category: "integration",
      valueType: "boolean",
      value: useMock,
      updatedBy,
    });

    await upsertSetting({
      key: SETTING_KEYS.gemini.modelDraft,
      category: "integration",
      valueType: "string",
      value: modelDraft,
      updatedBy,
    });

    await upsertSetting({
      key: SETTING_KEYS.gemini.modelFinal,
      category: "integration",
      valueType: "string",
      value: modelFinal,
      updatedBy,
    });

    await upsertSecretIfProvided({
      key: SETTING_KEYS.gemini.apiKey,
      category: "integration",
      value: apiKey,
      updatedBy,
    });

    resetGeminiClient();

    return NextResponse.json({
      ok: true,
      summary: await getGeminiSettingsSummary(),
    });
  }

  if (provider === "automation") {
    const parsed = automationSchema.safeParse(body);
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

  return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
}

export async function PUT(request: Request) {
  const auth = await requireSuperAdminSession();
  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();

  if (body?.action !== "test-amazon") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (await shouldUseAmazonMock()) {
    return NextResponse.json(
      { error: "Disable mock mode before testing a live Amazon connection." },
      { status: 400 },
    );
  }

  try {
    const client = await createAmazonPaapiClient();
    const items = await client.searchItems({
      keywords: "desk lamp",
      itemCount: 1,
    });

    return NextResponse.json({
      ok: true,
      message: `Connection successful. Sample result: ${items[0]?.ItemInfo?.Title?.DisplayValue ?? "1 item returned"}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Amazon connection test failed",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSuperAdminSession();
  if (auth.response) {
    return auth.response;
  }

  const body = await request.json();

  if (body?.action !== "test-gemini") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (await shouldUseGeminiMock()) {
    return NextResponse.json(
      { error: "Disable mock mode before testing a live Gemini connection." },
      { status: 400 },
    );
  }

  try {
    const { getGeminiClient } = await import("@/lib/ai/gemini/client");
    await getGeminiClient();
    return NextResponse.json({
      ok: true,
      message: "Gemini API key validated and client initialized.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gemini connection test failed",
      },
      { status: 400 },
    );
  }
}
