import type { ProductDiscoveryResult } from "@/lib/ai/discovery-types";

export function generateMockProductDiscovery(input: {
  campaignName: string;
  keywords: string[];
  limit: number;
}): ProductDiscoveryResult {
  const keyword =
    input.keywords[0] ?? "best home office desk lamp";

  const pool = [
    {
      asin: "B08LMTQ7ZF",
      title:
        "Lepro LED Desk Lamp for Home Office, 9.5W Metal Touch Control, 5 Color Modes",
      price: 22.99,
      rating: 4.8,
      reviewCount: 8011,
      overallScore: 92,
    },
    {
      asin: "B085LSKHM6",
      title: "BenQ ScreenBar Monitor Light for Home Office, Auto-Dimming",
      price: 109.0,
      rating: 4.7,
      reviewCount: 12500,
      overallScore: 88,
    },
    {
      asin: "B07V3WXYMK",
      title: "TaoTronics LED Desk Lamp, USB Charging Port, 5 Color Modes",
      price: 39.99,
      rating: 4.6,
      reviewCount: 42000,
      overallScore: 85,
    },
    {
      asin: "B07GBZ4Q68",
      title: "Anker Wireless Charging Pad with LED Desk Lamp",
      price: 49.99,
      rating: 4.5,
      reviewCount: 8900,
      overallScore: 79,
    },
    {
      asin: "B09J4RS847",
      title: "Globe Electric Architect Desk Lamp, Swing Arm, Matte Black",
      price: 34.97,
      rating: 4.4,
      reviewCount: 3100,
      overallScore: 76,
    },
    {
      asin: "B01MUHSNTM",
      title: "Phive LED Desk Lamp with Clamp, Architect Task Light",
      price: 59.99,
      rating: 4.5,
      reviewCount: 15600,
      overallScore: 81,
    },
    {
      asin: "B07Q2S42KC",
      title: "JUKSTG LED Desk Lamp with USB Port, Eye-Caring Table Lamp",
      price: 29.99,
      rating: 4.6,
      reviewCount: 22000,
      overallScore: 83,
    },
    {
      asin: "B08F2T4CP9",
      title: "Desk Lamp with Wireless Charger, 10W Fast Charging Base",
      price: 45.99,
      rating: 4.3,
      reviewCount: 5400,
      overallScore: 74,
    },
    {
      asin: "B07ZPKN6YR",
      title: "Amazon Basics LED Desk Lamp with 3 Color Modes",
      price: 19.99,
      rating: 4.5,
      reviewCount: 48000,
      overallScore: 77,
    },
    {
      asin: "B0B7C8DXYZ",
      title: "Quntis Monitor Light Bar Pro, Asymmetric Optical Design",
      price: 89.99,
      rating: 4.6,
      reviewCount: 6700,
      overallScore: 86,
    },
  ];

  const candidates = pool.slice(0, input.limit).map((item) => ({
    asin: item.asin,
    title: item.title,
    targetKeyword: keyword,
    price: item.price,
    currency: "USD" as const,
    rating: item.rating,
    reviewCount: item.reviewCount,
    amazonUrl: `https://www.amazon.com/dp/${item.asin}`,
    commissionCategory: "home & kitchen",
    estimatedCommissionRate: 0.045,
    estimatedCommissionUsd: Math.round(item.price * 0.045 * 100) / 100,
    demandScore: Math.min(100, Math.round(item.reviewCount / 500)),
    reviewFitScore: item.overallScore - 5,
    overallScore: item.overallScore,
    rationale: `${item.title} has strong review volume and fits "${keyword}" with clear pros/cons for an editorial review.`,
    demandSignals: [
      `${item.reviewCount.toLocaleString()}+ Amazon reviews`,
      `Commercial intent: "${keyword}"`,
      "Steady home-office demand",
    ],
    risks:
      item.price < 25
        ? ["Lower ticket size limits commission per sale"]
        : [],
  }));

  return {
    summary: `Mock discovery for campaign "${input.campaignName}" using seed keywords. Connect Gemini to run live Google Search discovery.`,
    searchedQueries: input.keywords.map((k) => `site:amazon.com ${k}`),
    candidates,
  };
}
