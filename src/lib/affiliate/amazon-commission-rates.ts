/** Approximate Amazon Associates US commission tiers for discovery scoring. */
const CATEGORY_RATES: Record<string, number> = {
  "luxury beauty": 0.1,
  beauty: 0.06,
  furniture: 0.08,
  "home improvement": 0.045,
  "home & kitchen": 0.045,
  kitchen: 0.045,
  office: 0.045,
  "office products": 0.045,
  sports: 0.045,
  outdoors: 0.045,
  tools: 0.045,
  health: 0.045,
  baby: 0.045,
  pet: 0.045,
  toys: 0.045,
  books: 0.045,
  electronics: 0.025,
  computers: 0.025,
  default: 0.03,
};

export function estimateAmazonCommissionRate(input: {
  categoryName?: string | null;
  commissionCategory?: string | null;
}): { category: string; rate: number } {
  const raw = (input.commissionCategory ?? input.categoryName ?? "").toLowerCase();

  for (const [key, rate] of Object.entries(CATEGORY_RATES)) {
    if (key !== "default" && raw.includes(key)) {
      return { category: key, rate };
    }
  }

  return { category: "default", rate: CATEGORY_RATES.default };
}

export function estimateCommissionUsd(price: number | undefined, rate: number): number | undefined {
  if (price === undefined || !Number.isFinite(price)) {
    return undefined;
  }

  return Math.round(price * rate * 100) / 100;
}

export function commissionRateLabel(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}
