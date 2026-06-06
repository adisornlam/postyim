import { AwsClient } from "aws4fetch";

import {
  getAmazonMarketplace,
  type AmazonCredentials,
} from "@/lib/env";
import { getAmazonCredentials } from "@/lib/settings/runtime-config";

import type {
  AmazonGetItemsResponse,
  AmazonPaapiItem,
  AmazonSearchItemsResponse,
} from "./normalize";

const SEARCH_TARGET =
  "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems";
const GET_ITEMS_TARGET =
  "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems";

const DEFAULT_RESOURCES = [
  "Images.Primary.Large",
  "Images.Primary.Medium",
  "ItemInfo.Title",
  "ItemInfo.Features",
  "ItemInfo.ByLineInfo",
  "ItemInfo.ProductInfo",
  "ItemInfo.Classifications",
  "Offers.Listings.Price",
];

export class AmazonPaapiClient {
  private readonly credentials: AmazonCredentials;
  private readonly marketplace: ReturnType<typeof getAmazonMarketplace>;
  private readonly aws: AwsClient;

  constructor(credentials: AmazonCredentials) {
    this.credentials = credentials;
    this.marketplace = getAmazonMarketplace(credentials.region);
    this.aws = new AwsClient({
      accessKeyId: credentials.accessKey,
      secretAccessKey: credentials.secretKey,
      region: this.marketplace.region,
      service: "ProductAdvertisingAPI",
    });
  }

  buildAffiliateLink(asin: string): string {
    return `https://${this.marketplace.marketplace}/dp/${asin}?tag=${this.credentials.partnerTag}`;
  }

  async searchItems(input: {
    keywords: string;
    searchIndex?: string;
    itemCount?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<AmazonPaapiItem[]> {
    const payload: Record<string, unknown> = {
      Keywords: input.keywords,
      SearchIndex: input.searchIndex ?? "All",
      ItemCount: Math.min(Math.max(input.itemCount ?? 10, 1), 10),
      PartnerTag: this.credentials.partnerTag,
      PartnerType: "Associates",
      Marketplace: this.marketplace.marketplace,
      Resources: DEFAULT_RESOURCES,
    };

    if (input.minPrice !== undefined) {
      payload.MinPrice = Math.round(input.minPrice * 100);
    }

    if (input.maxPrice !== undefined) {
      payload.MaxPrice = Math.round(input.maxPrice * 100);
    }

    const response = await this.request<AmazonSearchItemsResponse>(
      "/paapi5/searchitems",
      SEARCH_TARGET,
      payload,
    );

    return response.SearchResult?.Items ?? [];
  }

  async getItems(asins: string[]): Promise<AmazonPaapiItem[]> {
    if (asins.length === 0) {
      return [];
    }

    const response = await this.request<AmazonGetItemsResponse>(
      "/paapi5/getitems",
      GET_ITEMS_TARGET,
      {
        ItemIds: asins.slice(0, 10),
        PartnerTag: this.credentials.partnerTag,
        PartnerType: "Associates",
        Marketplace: this.marketplace.marketplace,
        Resources: DEFAULT_RESOURCES,
      },
    );

    return response.ItemsResult?.Items ?? [];
  }

  private async request<T>(
    path: string,
    target: string,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const url = `https://${this.marketplace.host}${path}`;
    const body = JSON.stringify(payload);

    const response = await this.aws.fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Content-Encoding": "amz-1.0",
        "X-Amz-Target": target,
      },
      body,
    });

    const data = (await response.json()) as T & {
      Errors?: Array<{ Code?: string; Message?: string }>;
    };

    if (!response.ok) {
      const message =
        data.Errors?.[0]?.Message ??
        `Amazon PA-API request failed with status ${response.status}`;
      throw new Error(message);
    }

    if (data.Errors?.length) {
      throw new Error(
        `${data.Errors[0]?.Code ?? "AmazonError"}: ${data.Errors[0]?.Message ?? "Unknown error"}`,
      );
    }

    return data;
  }
}

export async function createAmazonPaapiClient(): Promise<AmazonPaapiClient> {
  const credentials = await getAmazonCredentials();

  if (!credentials) {
    throw new Error(
      "Amazon PA-API credentials are not configured. Connect them in Admin → Settings → Integrations.",
    );
  }

  return new AmazonPaapiClient(credentials);
}
