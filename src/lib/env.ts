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

export function getSiteName(): string {
  return process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Postyim";
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}
