import { eq } from "drizzle-orm";

import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import type {
  SettingCategory,
  SettingValueType,
} from "@/lib/settings/keys";

type StoredSetting = {
  key: string;
  category: SettingCategory;
  valueType: SettingValueType;
  valuePlain: string | null;
  valueEncrypted: string | null;
  isSensitive: boolean;
};

type SettingsCache = Map<string, StoredSetting>;

let cache: SettingsCache | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 15_000;

export function invalidateSettingsCache() {
  cache = null;
  cacheLoadedAt = 0;
}

async function loadSettingsCache(): Promise<SettingsCache> {
  if (cache && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return cache;
  }

  const rows = await db.select().from(appSettings);
  cache = new Map(
    rows.map((row) => [
      row.key,
      {
        key: row.key,
        category: row.category,
        valueType: row.valueType,
        valuePlain: row.valuePlain,
        valueEncrypted: row.valueEncrypted,
        isSensitive: row.isSensitive,
      },
    ]),
  );
  cacheLoadedAt = Date.now();

  return cache;
}

function readBoolean(value: string | null | undefined): boolean | null {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
}

export async function getStoredSettingValue(key: string): Promise<string | null> {
  const settings = await loadSettingsCache();
  const row = settings.get(key);

  if (!row) {
    return null;
  }

  if (row.valueType === "secret") {
    if (!row.valueEncrypted) {
      return null;
    }

    return decryptSecret(row.valueEncrypted);
  }

  return row.valuePlain;
}

export async function getStoredBooleanSetting(
  key: string,
): Promise<boolean | null> {
  const value = await getStoredSettingValue(key);

  if (value === null) {
    return null;
  }

  return readBoolean(value);
}

export async function hasStoredSecret(key: string): Promise<boolean> {
  const settings = await loadSettingsCache();
  const row = settings.get(key);
  return Boolean(row?.valueEncrypted);
}

export async function upsertSetting(input: {
  key: string;
  category: SettingCategory;
  valueType: SettingValueType;
  value: string | boolean;
  isSensitive?: boolean;
  updatedBy?: string;
}) {
  const normalizedValue =
    typeof input.value === "boolean" ? String(input.value) : input.value.trim();

  const values = {
    key: input.key,
    category: input.category,
    valueType: input.valueType,
    isSensitive: input.isSensitive ?? input.valueType === "secret",
    updatedBy: input.updatedBy ?? null,
    valuePlain:
      input.valueType === "secret" ? null : normalizedValue || null,
    valueEncrypted:
      input.valueType === "secret" && normalizedValue
        ? encryptSecret(normalizedValue)
        : null,
  };

  await db
    .insert(appSettings)
    .values(values)
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        category: values.category,
        valueType: values.valueType,
        isSensitive: values.isSensitive,
        updatedBy: values.updatedBy,
        valuePlain: values.valuePlain,
        valueEncrypted: values.valueEncrypted,
        updatedAt: new Date(),
      },
    });

  invalidateSettingsCache();
}

export async function upsertSecretIfProvided(input: {
  key: string;
  category: SettingCategory;
  value?: string;
  updatedBy?: string;
}) {
  if (!input.value?.trim()) {
    return;
  }

  await upsertSetting({
    key: input.key,
    category: input.category,
    valueType: "secret",
    value: input.value.trim(),
    isSensitive: true,
    updatedBy: input.updatedBy,
  });
}

export async function deleteSetting(key: string) {
  await db.delete(appSettings).where(eq(appSettings.key, key));
  invalidateSettingsCache();
}

export async function listStoredSettingKeys(): Promise<string[]> {
  const settings = await loadSettingsCache();
  return [...settings.keys()];
}
