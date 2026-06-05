import type {
  AffiliateAdapter,
  RawProduct,
  SearchParams,
} from "@/lib/affiliate/types";

import {
  createAmazonPaapiClient,
  type AmazonPaapiClient,
} from "./client";
import { toRawProduct } from "./normalize";

export class AmazonAdapter implements AffiliateAdapter {
  readonly network = "amazon" as const;
  private readonly client: AmazonPaapiClient;

  constructor(client: AmazonPaapiClient) {
    this.client = client;
  }

  buildAffiliateLink(externalId: string): string {
    return this.client.buildAffiliateLink(externalId);
  }

  async searchProducts(params: SearchParams): Promise<RawProduct[]> {
    const items = await this.client.searchItems({
      keywords: params.keywords,
      searchIndex: params.searchIndex,
      itemCount: params.itemCount,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
    });

    return items
      .map((item) => {
        const raw = toRawProduct(item);

        if (!raw.externalId) {
          return null;
        }

        if (!raw.affiliateLink) {
          raw.affiliateLink = this.buildAffiliateLink(raw.externalId);
        }

        return raw;
      })
      .filter((item): item is RawProduct => item !== null);
  }

  async getProduct(externalId: string): Promise<RawProduct> {
    const items = await this.client.getItems([externalId]);
    const item = items[0];

    if (!item?.ASIN) {
      throw new Error(`Product not found for ASIN ${externalId}`);
    }

    const raw = toRawProduct(item);

    if (!raw.affiliateLink) {
      raw.affiliateLink = this.buildAffiliateLink(raw.externalId);
    }

    return raw;
  }
}

export function createAmazonAdapter(): AmazonAdapter {
  return new AmazonAdapter(createAmazonPaapiClient());
}
