export const PROHIBITED_PHRASES = [
  "in conclusion",
  "as an ai",
  "it's worth noting that",
  "it is worth noting that",
  "in today's fast-paced world",
  "look no further",
  "game-changer",
  "delve into",
  "navigate the landscape",
  "without further ado",
];

export const AFFILIATE_DISCLOSURE_MARKERS = [
  "affiliate",
  "commission",
  "qualifying purchases",
  "earn from qualifying",
  "paid link",
];

export const DEFAULT_DISCLOSURE =
  "Disclosure: As an Amazon Associate, I earn from qualifying purchases. This review contains affiliate links, and I may receive a commission if you buy through them at no extra cost to you.";

export const QUALITY_THRESHOLDS = {
  minWordCount: 1500,
  minUniquenessScore: 85,
  minPros: 3,
  minCons: 3,
  metaDescriptionMin: 120,
  metaDescriptionMax: 160,
  minMarkdownHeadings: 3,
  minBodyImages: 3,
  minHeroImages: 2,
} as const;

export function normalizeMetaDescription(value: string): string {
  let base = value.trim();

  if (base.length < QUALITY_THRESHOLDS.metaDescriptionMin) {
    base = `${base} Honest buyer guide with pros, cons, and recommendations.`.trim();
  }

  if (base.length > QUALITY_THRESHOLDS.metaDescriptionMax) {
    base = `${base.slice(0, 157).trimEnd()}...`;
  }

  return base;
}

export const REVIEW_STRUCTURE_TEMPLATES = [
  {
    id: "hands-on-first",
    openingStyle: "Start with a specific scenario where you tested the product.",
    sections: [
      "First Impressions",
      "Build Quality and Design",
      "Performance in Daily Use",
      "Who Should Buy It",
      "Final Verdict",
    ],
  },
  {
    id: "buyer-guide",
    openingStyle: "Open with the buying question the reader is trying to solve.",
    sections: [
      "What You Need to Know Up Front",
      "Standout Features",
      "Where It Falls Short",
      "Comparison With Typical Alternatives",
      "Bottom Line",
    ],
  },
  {
    id: "deep-dive",
    openingStyle: "Lead with your expert perspective and why this category matters.",
    sections: [
      "Why This Product Matters",
      "Detailed Feature Analysis",
      "Real-World Pros and Cons",
      "Value for Money",
      "Recommendation",
    ],
  },
  {
    id: "problem-solution",
    openingStyle: "Begin with the pain point this product is meant to solve.",
    sections: [
      "The Problem It Solves",
      "Setup and Usability",
      "Strengths Worth Paying For",
      "Weaknesses You Should Know",
      "Should You Buy It?",
    ],
  },
] as const;
