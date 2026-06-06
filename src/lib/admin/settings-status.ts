import {
  getAmazonCredentials,
  getAmazonPartnerTag,
  getCronSecret,
  getGeminiApiKey,
  getGeminiModelDraft,
  getGeminiModelFinal,
  getAmazonSettingsSummary,
  getAutomationSettingsSummary,
  getGeminiSettingsSummary,
  isAmazonConfigured,
  isGeminiConfigured,
  shouldUseAmazonMock,
  shouldUseGeminiMock,
} from "@/lib/settings/runtime-config";
import {
  getAmazonMarketplace,
  getSiteName,
  getSiteUrl,
} from "@/lib/env";

export type AdminSettingStatus = "ready" | "warning" | "missing";

export interface AdminSettingField {
  label: string;
  value: string;
  status?: AdminSettingStatus;
}

export interface AdminSettingSection {
  id: string;
  title: string;
  description: string;
  status: AdminSettingStatus;
  summary: string;
  fields: AdminSettingField[];
  envKeys: string[];
  storage: "database" | "environment";
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function maskConfigured(value?: string) {
  if (!value) {
    return "Not configured";
  }

  if (value.length <= 4) {
    return "Configured";
  }

  return `Configured (••••${value.slice(-4)})`;
}

export async function getAmazonIntegrationSection(): Promise<AdminSettingSection> {
  const summary = await getAmazonSettingsSummary();
  const partnerTag = await getAmazonPartnerTag();
  const mock = await shouldUseAmazonMock();
  const marketplace = getAmazonMarketplace(summary.region);
  const live = (await isAmazonConfigured()) && !mock;
  const hasPartialConfig =
    summary.hasPartnerTag || summary.hasAccessKey || summary.hasSecretKey;

  const status: AdminSettingStatus = live
    ? "ready"
    : hasPartialConfig
      ? "warning"
      : "missing";

  return {
    id: "amazon",
    title: "Amazon Marketplace",
    description:
      "Product catalog ingestion via Amazon Product Advertising API (PA-API).",
    status,
    summary: live
      ? `Live connection to ${marketplace.marketplace}`
      : mock
        ? summary.hasPartnerTag
          ? `Mock mode — partner tag ${partnerTag} saved; add PA-API keys when eligible`
          : "Mock catalog enabled for development"
        : hasPartialConfig
          ? "Partially configured — add remaining PA-API credentials for live ingestion"
          : "Connect marketplace credentials to enable live ingestion",
    storage: summary.storedInDatabase ? "database" : "environment",
    fields: [
      {
        label: "Storage",
        value: summary.storedInDatabase
          ? "Encrypted in database"
          : "Environment fallback",
        status: summary.storedInDatabase ? "ready" : "warning",
      },
      {
        label: "Connection mode",
        value: mock ? "Mock (development)" : "Live",
        status: mock ? "warning" : "ready",
      },
      {
        label: "Marketplace",
        value: marketplace.marketplace,
      },
      {
        label: "API region",
        value: marketplace.region,
      },
      {
        label: "Partner tag",
        value: partnerTag || "Not configured",
        status: partnerTag ? "ready" : "missing",
      },
      {
        label: "Access key",
        value: summary.hasAccessKey ? "Configured" : "Not configured",
        status: summary.hasAccessKey ? "ready" : "missing",
      },
      {
        label: "Secret key",
        value: summary.hasSecretKey ? "Configured" : "Not configured",
        status: summary.hasSecretKey ? "ready" : "missing",
      },
    ],
    envKeys: [],
  };
}

export async function getGeminiIntegrationSection(): Promise<AdminSettingSection> {
  const summary = await getGeminiSettingsSummary();
  const mock = await shouldUseGeminiMock();
  const live = (await isGeminiConfigured()) && !mock;
  const apiKey = await getGeminiApiKey();

  const status: AdminSettingStatus = live
    ? "ready"
    : (await isGeminiConfigured())
      ? "warning"
      : "missing";

  return {
    id: "gemini",
    title: "Gemini AI",
    description:
      "AI review drafting, quality checks, and editorial generation pipeline.",
    status,
    summary: live
      ? "Live AI generation enabled"
      : mock
        ? summary.hasApiKey
          ? "Mock mode — API key saved; disable mock to use live Gemini"
          : "Mock generator enabled for development"
        : "Connect Gemini API key to enable live generation",
    storage: summary.storedInDatabase ? "database" : "environment",
    fields: [
      {
        label: "Storage",
        value: summary.storedInDatabase
          ? "Encrypted in database"
          : "Environment fallback",
        status: summary.storedInDatabase ? "ready" : "warning",
      },
      {
        label: "Connection mode",
        value: mock ? "Mock (development)" : "Live",
        status: mock ? "warning" : "ready",
      },
      {
        label: "API key",
        value: maskConfigured(apiKey),
        status: apiKey ? "ready" : "missing",
      },
      {
        label: "Draft model",
        value: await getGeminiModelDraft(),
      },
      {
        label: "Final model",
        value: await getGeminiModelFinal(),
      },
    ],
    envKeys: [],
  };
}

export function getDatabaseSystemSection(): AdminSettingSection {
  const configured = Boolean(process.env.DATABASE_URL?.trim());

  return {
    id: "database",
    title: "Database",
    description: "PostgreSQL connection for products, reviews, and admin users.",
    status: configured ? "ready" : "missing",
    summary: configured
      ? "DATABASE_URL is configured"
      : "Database connection string is missing",
    storage: "environment",
    fields: [
      {
        label: "Connection",
        value: configured ? "Configured" : "Not configured",
        status: configured ? "ready" : "missing",
      },
      {
        label: "Environment",
        value: process.env.NODE_ENV ?? "development",
      },
    ],
    envKeys: ["DATABASE_URL"],
  };
}

export function getSecuritySystemSection(): AdminSettingSection {
  const authSecret = Boolean(process.env.AUTH_SECRET?.trim());

  return {
    id: "security",
    title: "Security & admin access",
    description:
      "Session signing and admin authentication. Password changes are managed per user.",
    status: authSecret ? "ready" : isProduction() ? "missing" : "warning",
    summary: authSecret
      ? "Admin sessions are protected with AUTH_SECRET"
      : "Set AUTH_SECRET before production deploy",
    storage: "environment",
    fields: [
      {
        label: "Session secret",
        value: authSecret ? "Configured" : "Not configured",
        status: authSecret ? "ready" : "missing",
      },
      {
        label: "Settings encryption",
        value: process.env.SETTINGS_ENCRYPTION_KEY?.trim()
          ? "Dedicated key configured"
          : process.env.AUTH_SECRET?.trim()
            ? "Derived from AUTH_SECRET"
            : "Development fallback",
      },
      {
        label: "Admin accounts",
        value: "Managed in database (seed with pnpm db:seed)",
      },
    ],
    envKeys: ["AUTH_SECRET", "SETTINGS_ENCRYPTION_KEY"],
  };
}

export async function getAutomationSystemSection(): Promise<AdminSettingSection> {
  const summary = await getAutomationSettingsSummary();
  const cronSecret = Boolean(await getCronSecret());

  return {
    id: "automation",
    title: "Scheduled jobs",
    description:
      "Secures cron endpoints and background job triggers (ingestion, generation, price refresh).",
    status: cronSecret ? "ready" : isProduction() ? "missing" : "warning",
    summary: cronSecret
      ? "Cron authentication configured"
      : "Set a cron secret before enabling production jobs",
    storage: summary.storedInDatabase ? "database" : "environment",
    fields: [
      {
        label: "Storage",
        value: summary.storedInDatabase
          ? "Encrypted in database"
          : "Environment fallback",
        status: summary.storedInDatabase ? "ready" : "warning",
      },
      {
        label: "Cron authentication",
        value: summary.hasCronSecret ? "Configured" : "Not configured",
        status: summary.hasCronSecret ? "ready" : "missing",
      },
      {
        label: "Daily cron route",
        value: "/api/cron/daily",
      },
    ],
    envKeys: [],
  };
}

export function getSiteSystemSection(): AdminSettingSection {
  const siteUrl = getSiteUrl();
  const https = siteUrl.startsWith("https://");

  return {
    id: "site",
    title: "Public site",
    description:
      "Branding and canonical URLs used in sitemap, OG tags, and affiliate links.",
    status: https ? "ready" : "warning",
    summary: https
      ? siteUrl
      : "Set NEXT_PUBLIC_SITE_URL to your production HTTPS domain",
    storage: "environment",
    fields: [
      {
        label: "Site name",
        value: getSiteName(),
      },
      {
        label: "Site URL",
        value: siteUrl,
        status: https ? "ready" : "warning",
      },
    ],
    envKeys: ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SITE_NAME"],
  };
}

export async function getIntegrationSections() {
  return [await getAmazonIntegrationSection(), await getGeminiIntegrationSection()];
}

export async function getSystemSections() {
  return [
    getDatabaseSystemSection(),
    getSecuritySystemSection(),
    await getAutomationSystemSection(),
    getSiteSystemSection(),
  ];
}

export async function getSetupAttentionSummary() {
  const integrationSections = await getIntegrationSections();
  const systemSections = await getSystemSections();
  const integrationIssues = integrationSections.filter(
    (section) => section.status !== "ready",
  ).length;
  const systemIssues = systemSections.filter(
    (section) => section.status !== "ready",
  ).length;

  return {
    integrationIssues,
    systemIssues,
    total: integrationIssues + systemIssues,
  };
}

export interface ProductionReadinessCheck {
  id: string;
  label: string;
  status: AdminSettingStatus;
  detail: string;
}

export function toProductionReadinessChecks(
  sections: AdminSettingSection[],
): ProductionReadinessCheck[] {
  return sections.map((section) => ({
    id: section.id,
    label: section.title,
    status: section.status,
    detail: section.summary,
  }));
}

export async function getProductionReadiness(): Promise<ProductionReadinessCheck[]> {
  return toProductionReadinessChecks([
    ...(await getIntegrationSections()),
    ...(await getSystemSections()),
  ]);
}
