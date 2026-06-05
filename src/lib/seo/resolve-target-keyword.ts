export interface ProductKeywordContext {
  productTitle: string;
  externalId: string;
  campaignKeywords: string[];
}

const PRODUCT_TYPE_RULES = [
  {
    id: "lamp",
    productHints: ["lamp", "light", "LAMP"],
    keywordHints: ["lamp", "light", "lighting", "task light"],
    fallback: "desk lamp",
  },
  {
    id: "desk",
    productHints: ["desk", "DESK"],
    keywordHints: ["desk", "standing desk", "sit stand"],
    fallback: "standing desk",
  },
  {
    id: "chair",
    productHints: ["chair", "CHAIR"],
    keywordHints: ["chair", "seating", "ergonomic"],
    fallback: "ergonomic office chair",
  },
] as const;

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function detectProductType(input: ProductKeywordContext) {
  const title = normalize(input.productTitle);
  const externalId = input.externalId.toUpperCase();

  return (
    PRODUCT_TYPE_RULES.find((rule) =>
      rule.productHints.some(
        (hint) =>
          title.includes(hint.toLowerCase()) || externalId.includes(hint),
      ),
    ) ?? null
  );
}

function keywordMatchesProductType(
  keyword: string,
  rule: (typeof PRODUCT_TYPE_RULES)[number],
): boolean {
  const normalized = normalize(keyword);
  return rule.keywordHints.some((hint) => normalized.includes(hint));
}

export function resolveTargetKeyword(input: ProductKeywordContext): string {
  const campaignKeywords = input.campaignKeywords
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  const productType = detectProductType(input);

  if (productType) {
    const matchedCampaignKeyword = campaignKeywords.find((keyword) =>
      keywordMatchesProductType(keyword, productType),
    );

    if (matchedCampaignKeyword) {
      return matchedCampaignKeyword;
    }

    return productType.fallback;
  }

  const title = normalize(input.productTitle);
  const titleMatchedKeyword = campaignKeywords.find((keyword) =>
    normalize(keyword)
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .some((word) => title.includes(word)),
  );

  if (titleMatchedKeyword) {
    return titleMatchedKeyword;
  }

  if (campaignKeywords[0]) {
    return campaignKeywords[0];
  }

  return `${input.productTitle} review`.slice(0, 300);
}

export function scoreKeywordRelevance(input: ProductKeywordContext & {
  targetKeyword: string;
}): { score: number; passed: boolean; reason?: string } {
  const productType = detectProductType(input);

  if (!productType) {
    const title = normalize(input.productTitle);
    const keyword = normalize(input.targetKeyword);
    const overlap = keyword
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .some((word) => title.includes(word));

    return overlap
      ? { score: 100, passed: true }
      : {
          score: 35,
          passed: false,
          reason: "Target keyword does not overlap with the product title.",
        };
  }

  if (keywordMatchesProductType(input.targetKeyword, productType)) {
    return { score: 100, passed: true };
  }

  return {
    score: 0,
    passed: false,
    reason: `Keyword "${input.targetKeyword}" does not match ${productType.id} product intent.`,
  };
}
