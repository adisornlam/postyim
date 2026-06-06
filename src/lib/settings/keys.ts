export const SETTING_KEYS = {
  amazon: {
    accessKey: "amazon.access_key",
    secretKey: "amazon.secret_key",
    partnerTag: "amazon.partner_tag",
    region: "amazon.region",
    mock: "amazon.mock",
  },
  gemini: {
    apiKey: "gemini.api_key",
    modelDraft: "gemini.model_draft",
    modelFinal: "gemini.model_final",
    mock: "gemini.mock",
  },
  automation: {
    cronSecret: "automation.cron_secret",
  },
} as const;

export type SettingCategory = "integration" | "automation" | "site" | "security";

export type SettingValueType = "string" | "secret" | "boolean";
