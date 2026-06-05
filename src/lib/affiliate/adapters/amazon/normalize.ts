import type { RawProduct } from "@/lib/affiliate/types";

interface AmazonMoney {
  Amount?: number;
  Currency?: string;
  DisplayAmount?: string;
}

interface AmazonListing {
  Price?: AmazonMoney;
}

interface AmazonOffers {
  Listings?: AmazonListing[];
}

interface AmazonImage {
  URL?: string;
}

interface AmazonImages {
  Primary?: {
    Large?: AmazonImage;
    Medium?: AmazonImage;
  };
}

interface AmazonItemInfo {
  Title?: { DisplayValue?: string };
  Features?: { DisplayValues?: string[] };
  ByLineInfo?: {
    Brand?: { DisplayValue?: string };
    Manufacturer?: { DisplayValue?: string };
  };
  ProductInfo?: {
    Color?: { DisplayValue?: string };
    Size?: { DisplayValue?: string };
    ItemDimensions?: {
      Height?: { DisplayValue?: number; Unit?: string };
      Length?: { DisplayValue?: number; Unit?: string };
      Width?: { DisplayValue?: number; Unit?: string };
      Weight?: { DisplayValue?: number; Unit?: string };
    };
  };
  Classifications?: {
    Binding?: { DisplayValue?: string };
    ProductGroup?: { DisplayValue?: string };
  };
  ContentInfo?: {
    PagesCount?: { DisplayValue?: number };
  };
}

export interface AmazonPaapiItem {
  ASIN?: string;
  DetailPageURL?: string;
  Images?: AmazonImages;
  ItemInfo?: AmazonItemInfo;
  Offers?: AmazonOffers;
}

export interface AmazonSearchItemsResponse {
  SearchResult?: {
    Items?: AmazonPaapiItem[];
    TotalResultCount?: number;
  };
  Errors?: Array<{ Code?: string; Message?: string }>;
}

export interface AmazonGetItemsResponse {
  ItemsResult?: {
    Items?: AmazonPaapiItem[];
  };
  Errors?: Array<{ Code?: string; Message?: string }>;
}

function formatDimension(
  value: { DisplayValue?: number; Unit?: string } | undefined,
): string | undefined {
  if (!value?.DisplayValue) {
    return undefined;
  }

  return value.Unit
    ? `${value.DisplayValue} ${value.Unit}`
    : String(value.DisplayValue);
}

export function normalizeAmazonItem(item: AmazonPaapiItem): {
  externalId: string;
  title: string;
  description?: string;
  price?: number;
  currency: string;
  affiliateLink: string;
  imageUrl?: string;
  specs: Record<string, unknown>;
} {
  const externalId = item.ASIN ?? "";
  const title = item.ItemInfo?.Title?.DisplayValue ?? "Unknown Product";
  const features = item.ItemInfo?.Features?.DisplayValues ?? [];
  const listing = item.Offers?.Listings?.[0];
  const price = listing?.Price?.Amount;
  const currency = listing?.Price?.Currency ?? "USD";
  const imageUrl =
    item.Images?.Primary?.Large?.URL ??
    item.Images?.Primary?.Medium?.URL ??
    undefined;

  const dimensions = item.ItemInfo?.ProductInfo?.ItemDimensions;

  const specs: Record<string, unknown> = {
    brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue,
    manufacturer: item.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue,
    features,
    color: item.ItemInfo?.ProductInfo?.Color?.DisplayValue,
    size: item.ItemInfo?.ProductInfo?.Size?.DisplayValue,
    productGroup: item.ItemInfo?.Classifications?.ProductGroup?.DisplayValue,
    binding: item.ItemInfo?.Classifications?.Binding?.DisplayValue,
    dimensions: {
      height: formatDimension(dimensions?.Height),
      length: formatDimension(dimensions?.Length),
      width: formatDimension(dimensions?.Width),
      weight: formatDimension(dimensions?.Weight),
    },
  };

  return {
    externalId,
    title,
    description: features.slice(0, 3).join(" "),
    price,
    currency,
    affiliateLink: item.DetailPageURL ?? "",
    imageUrl,
    specs,
  };
}

export function toRawProduct(item: AmazonPaapiItem): RawProduct {
  const normalized = normalizeAmazonItem(item);

  return {
    ...normalized,
    rawData: item,
  };
}

export function getAmazonApiError(
  response: AmazonSearchItemsResponse | AmazonGetItemsResponse,
): string | undefined {
  const error = response.Errors?.[0];
  if (!error) {
    return undefined;
  }

  return `${error.Code ?? "UnknownError"}: ${error.Message ?? "Request failed"}`;
}
