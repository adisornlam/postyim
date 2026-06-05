const MARKETPLACE_BY_REGION: Record<
  string,
  { host: string; region: string; marketplace: string }
> = {
  "us-east-1": {
    host: "webservices.amazon.com",
    region: "us-east-1",
    marketplace: "www.amazon.com",
  },
  "eu-west-1": {
    host: "webservices.amazon.co.uk",
    region: "eu-west-1",
    marketplace: "www.amazon.co.uk",
  },
  "us-west-2": {
    host: "webservices.amazon.com",
    region: "us-west-2",
    marketplace: "www.amazon.com",
  },
};

export interface AmazonCredentials {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  region: string;
}

export function getAmazonMarketplace(region: string) {
  return MARKETPLACE_BY_REGION[region] ?? MARKETPLACE_BY_REGION["us-east-1"];
}

export function getAmazonCredentials(): AmazonCredentials | null {
  const accessKey = process.env.AMAZON_ACCESS_KEY?.trim();
  const secretKey = process.env.AMAZON_SECRET_KEY?.trim();
  const partnerTag = process.env.AMAZON_PARTNER_TAG?.trim();
  const region = process.env.AMAZON_REGION?.trim() || "us-east-1";

  if (!accessKey || !secretKey || !partnerTag) {
    return null;
  }

  return { accessKey, secretKey, partnerTag, region };
}

export function isAmazonConfigured(): boolean {
  return getAmazonCredentials() !== null;
}

export function shouldUseAmazonMock(): boolean {
  if (process.env.AMAZON_MOCK === "true") {
    return true;
  }

  return !isAmazonConfigured();
}

export function getCronSecret(): string | undefined {
  return process.env.CRON_SECRET?.trim() || undefined;
}

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

export function getGeminiModelDraft(): string {
  return process.env.GEMINI_MODEL_DRAFT?.trim() || "gemini-2.0-flash";
}

export function getGeminiModelFinal(): string {
  return process.env.GEMINI_MODEL_FINAL?.trim() || "gemini-2.0-pro";
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function shouldUseGeminiMock(): boolean {
  if (process.env.GEMINI_MOCK === "true") {
    return true;
  }

  return !isGeminiConfigured();
}

export function getSiteName(): string {
  return process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Postyim";
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}

export interface ProductionReadinessCheck {
  id: string;
  label: string;
  status: "ready" | "warning" | "missing";
  detail: string;
}

export function getProductionReadiness(): ProductionReadinessCheck[] {
  const isProduction = process.env.NODE_ENV === "production";
  const amazonLive = isAmazonConfigured() && !shouldUseAmazonMock();
  const geminiLive = isGeminiConfigured() && !shouldUseGeminiMock();

  return [
    {
      id: "database",
      label: "Database",
      status: process.env.DATABASE_URL ? "ready" : "missing",
      detail: process.env.DATABASE_URL
        ? "DATABASE_URL is configured"
        : "Set DATABASE_URL",
    },
    {
      id: "amazon",
      label: "Amazon PA-API",
      status: amazonLive ? "ready" : isAmazonConfigured() ? "warning" : "missing",
      detail: amazonLive
        ? "Live Amazon adapter enabled"
        : shouldUseAmazonMock()
          ? "Running in mock mode — add credentials and set AMAZON_MOCK=false"
          : "Add AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG",
    },
    {
      id: "gemini",
      label: "Gemini AI",
      status: geminiLive ? "ready" : isGeminiConfigured() ? "warning" : "missing",
      detail: geminiLive
        ? "Live Gemini generation enabled"
        : shouldUseGeminiMock()
          ? "Running in mock mode — add GEMINI_API_KEY and set GEMINI_MOCK=false"
          : "Add GEMINI_API_KEY",
    },
    {
      id: "cron",
      label: "Cron secret",
      status: getCronSecret() ? "ready" : isProduction ? "missing" : "warning",
      detail: getCronSecret()
        ? "CRON_SECRET configured for job endpoints"
        : "Set CRON_SECRET before production deploy",
    },
    {
      id: "auth",
      label: "Admin auth",
      status:
        process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET
          ? "ready"
          : isProduction
            ? "missing"
            : "warning",
      detail:
        process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET
          ? "Admin password and AUTH_SECRET configured"
          : "Set ADMIN_PASSWORD and AUTH_SECRET",
    },
    {
      id: "site",
      label: "Public site URL",
      status: process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
        ? "ready"
        : "warning",
      detail:
        process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://")
          ? process.env.NEXT_PUBLIC_SITE_URL
          : "Set NEXT_PUBLIC_SITE_URL to your production domain",
    },
  ];
}
