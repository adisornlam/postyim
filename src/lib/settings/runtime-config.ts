import type { AmazonCredentials } from "@/lib/env";
import { SETTING_KEYS } from "@/lib/settings/keys";
import {
  getStoredBooleanSetting,
  getStoredSettingValue,
  hasStoredSecret,
} from "@/lib/settings/app-settings";

function readEnvBoolean(name: string): boolean | null {
  const value = process.env[name]?.trim().toLowerCase();

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

async function resolveBoolean(
  dbKey: string,
  envName: string,
  defaultValue: boolean,
): Promise<boolean> {
  const stored = await getStoredBooleanSetting(dbKey);

  if (stored !== null) {
    return stored;
  }

  const envValue = readEnvBoolean(envName);

  if (envValue !== null) {
    return envValue;
  }

  return defaultValue;
}

async function resolveString(
  dbKey: string,
  envName: string,
  fallback = "",
): Promise<string> {
  const stored = await getStoredSettingValue(dbKey);

  if (stored !== null && stored !== "") {
    return stored;
  }

  return process.env[envName]?.trim() || fallback;
}

async function resolveSecret(
  dbKey: string,
  envName: string,
): Promise<string | undefined> {
  const stored = await getStoredSettingValue(dbKey);

  if (stored) {
    return stored;
  }

  return process.env[envName]?.trim() || undefined;
}

export async function getAmazonPartnerTag(): Promise<string> {
  return resolveString(
    SETTING_KEYS.amazon.partnerTag,
    "AMAZON_PARTNER_TAG",
  );
}

export async function getAmazonCredentials(): Promise<AmazonCredentials | null> {
  const accessKey = await resolveSecret(
    SETTING_KEYS.amazon.accessKey,
    "AMAZON_ACCESS_KEY",
  );
  const secretKey = await resolveSecret(
    SETTING_KEYS.amazon.secretKey,
    "AMAZON_SECRET_KEY",
  );
  const partnerTag = await getAmazonPartnerTag();
  const region = await resolveString(
    SETTING_KEYS.amazon.region,
    "AMAZON_REGION",
    "us-east-1",
  );

  if (!accessKey || !secretKey || !partnerTag) {
    return null;
  }

  return { accessKey, secretKey, partnerTag, region };
}

export async function isAmazonConfigured(): Promise<boolean> {
  return (await getAmazonCredentials()) !== null;
}

export async function shouldUseAmazonMock(): Promise<boolean> {
  const mockEnabled = await resolveBoolean(
    SETTING_KEYS.amazon.mock,
    "AMAZON_MOCK",
    false,
  );

  if (mockEnabled) {
    return true;
  }

  return !(await isAmazonConfigured());
}

export async function getGeminiApiKey(): Promise<string | undefined> {
  return resolveSecret(SETTING_KEYS.gemini.apiKey, "GEMINI_API_KEY");
}

export async function getGeminiModelDraft(): Promise<string> {
  return resolveString(
    SETTING_KEYS.gemini.modelDraft,
    "GEMINI_MODEL_DRAFT",
    "gemini-2.0-flash",
  );
}

export async function getGeminiModelFinal(): Promise<string> {
  return resolveString(
    SETTING_KEYS.gemini.modelFinal,
    "GEMINI_MODEL_FINAL",
    "gemini-2.5-flash",
  );
}

export async function isGeminiConfigured(): Promise<boolean> {
  return Boolean(await getGeminiApiKey());
}

export async function shouldUseGeminiMock(): Promise<boolean> {
  const mockEnabled = await resolveBoolean(
    SETTING_KEYS.gemini.mock,
    "GEMINI_MOCK",
    false,
  );

  if (mockEnabled) {
    return true;
  }

  return !(await isGeminiConfigured());
}

export async function getCronSecret(): Promise<string | undefined> {
  return resolveSecret(
    SETTING_KEYS.automation.cronSecret,
    "CRON_SECRET",
  );
}

export async function getAmazonSettingsSummary() {
  const credentials = await getAmazonCredentials();
  const partnerTag = await getAmazonPartnerTag();
  const mock = await shouldUseAmazonMock();

  return {
    mock,
    configured: Boolean(credentials),
    hasPartnerTag: Boolean(partnerTag),
    region: credentials?.region ?? (await resolveString(
      SETTING_KEYS.amazon.region,
      "AMAZON_REGION",
      "us-east-1",
    )),
    partnerTag,
    hasAccessKey:
      (await hasStoredSecret(SETTING_KEYS.amazon.accessKey)) ||
      Boolean(process.env.AMAZON_ACCESS_KEY?.trim()),
    hasSecretKey:
      (await hasStoredSecret(SETTING_KEYS.amazon.secretKey)) ||
      Boolean(process.env.AMAZON_SECRET_KEY?.trim()),
    storedInDatabase:
      (await hasStoredSecret(SETTING_KEYS.amazon.accessKey)) ||
      (await hasStoredSecret(SETTING_KEYS.amazon.secretKey)) ||
      Boolean(await getStoredSettingValue(SETTING_KEYS.amazon.partnerTag)),
  };
}

export async function getGeminiSettingsSummary() {
  const mock = await shouldUseGeminiMock();

  return {
    mock,
    configured: await isGeminiConfigured(),
    modelDraft: await getGeminiModelDraft(),
    modelFinal: await getGeminiModelFinal(),
    hasApiKey:
      (await hasStoredSecret(SETTING_KEYS.gemini.apiKey)) ||
      Boolean(process.env.GEMINI_API_KEY?.trim()),
    storedInDatabase: await hasStoredSecret(SETTING_KEYS.gemini.apiKey),
  };
}

export async function getAutomationSettingsSummary() {
  return {
    hasCronSecret:
      (await hasStoredSecret(SETTING_KEYS.automation.cronSecret)) ||
      Boolean(process.env.CRON_SECRET?.trim()),
    storedInDatabase: await hasStoredSecret(
      SETTING_KEYS.automation.cronSecret,
    ),
  };
}
