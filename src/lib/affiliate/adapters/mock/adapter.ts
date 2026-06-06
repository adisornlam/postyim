import type {
  AffiliateAdapter,
  RawProduct,
  SearchParams,
} from "@/lib/affiliate/types";
import { buildAmazonAffiliateLink } from "@/lib/affiliate/links";
import { getAmazonPartnerTag } from "@/lib/settings/runtime-config";

const MOCK_PRODUCTS: RawProduct[] = [
  {
    externalId: "B0MOCKDESK01",
    title: "FlexiPro Electric Standing Desk",
    description:
      "Height-adjustable standing desk with memory presets and solid steel frame.",
    price: 349.99,
    currency: "USD",
    affiliateLink: "https://www.amazon.com/dp/B0MOCKDESK01",
    imageUrl: "https://picsum.photos/seed/flexipro-desk/960/640",
    specs: {
      brand: "FlexiPro",
      features: [
        "Electric height adjustment",
        "Memory preset positions",
        "55 x 28 inch desktop",
      ],
      color: "Walnut",
      dimensions: {
        height: "28-47 in",
        width: "55 in",
        depth: "28 in",
      },
    },
    rawData: { source: "mock", asin: "B0MOCKDESK01" },
  },
  {
    externalId: "B0MOCKCHAIR02",
    title: "ErgoLift Mesh Office Chair",
    description:
      "Breathable mesh back chair with lumbar support for long work sessions.",
    price: 289.5,
    currency: "USD",
    affiliateLink: "https://www.amazon.com/dp/B0MOCKCHAIR02",
    imageUrl: "https://picsum.photos/seed/ergolift-chair/960/640",
    specs: {
      brand: "ErgoLift",
      features: [
        "Adjustable lumbar support",
        "Breathable mesh back",
        "4D armrests",
      ],
      color: "Black",
      dimensions: {
        height: "45 in",
        width: "27 in",
        depth: "27 in",
      },
    },
    rawData: { source: "mock", asin: "B0MOCKCHAIR02" },
  },
  {
    externalId: "B0MOCKLAMP03",
    title: "LumenArc LED Desk Lamp",
    description:
      "Eye-care LED desk lamp with adjustable brightness and color temperature.",
    price: 59.99,
    currency: "USD",
    affiliateLink: "https://www.amazon.com/dp/B0MOCKLAMP03",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=960&q=80",
    specs: {
      brand: "LumenArc",
      features: [
        "5 brightness levels",
        "3 color temperatures",
        "USB charging port",
      ],
      color: "Silver",
    },
    rawData: { source: "mock", asin: "B0MOCKLAMP03" },
  },
];

export class MockAmazonAdapter implements AffiliateAdapter {
  readonly network = "amazon" as const;
  private readonly partnerTag: string;

  constructor(partnerTag: string) {
    this.partnerTag = partnerTag;
  }

  buildAffiliateLink(externalId: string): string {
    return buildAmazonAffiliateLink(externalId, this.partnerTag);
  }

  async searchProducts(params: SearchParams): Promise<RawProduct[]> {
    const limit = Math.min(params.itemCount ?? 10, MOCK_PRODUCTS.length);
    const keyword = params.keywords.toLowerCase();

    const filtered = MOCK_PRODUCTS.filter((product) => {
      const haystack = `${product.title} ${product.description ?? ""}`.toLowerCase();
      return haystack.includes(keyword) || keyword.includes("office");
    });

    const results = (filtered.length > 0 ? filtered : MOCK_PRODUCTS).slice(
      0,
      limit,
    );

    return results.map((product) => ({
      ...product,
      affiliateLink: this.buildAffiliateLink(product.externalId),
    }));
  }

  async getProduct(externalId: string): Promise<RawProduct> {
    const product = MOCK_PRODUCTS.find((item) => item.externalId === externalId);

    if (!product) {
      throw new Error(`Mock product not found for ASIN ${externalId}`);
    }

    return {
      ...product,
      affiliateLink: this.buildAffiliateLink(product.externalId),
    };
  }
}

export async function createMockAmazonAdapter(): Promise<MockAmazonAdapter> {
  const partnerTag = (await getAmazonPartnerTag()) || "mock-partner-20";
  return new MockAmazonAdapter(partnerTag);
}
