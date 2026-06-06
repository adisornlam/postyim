import type { ReviewGenerationInput } from "@/lib/ai/types";
import { REVIEW_STRUCTURE_TEMPLATES } from "@/lib/ai/constants";

const SECTION_KEYWORD_HINTS: Record<string, string[]> = {
  "What You Need to Know Up Front": [
    "desk lamp for home office",
    "task lighting",
    "eye strain",
  ],
  "Standout Features": [
    "LED desk lamp brightness",
    "color temperature",
    "touch control",
  ],
  "Where It Falls Short": [
    "desk lamp limitations",
    "corded lamp",
  ],
  "Comparison With Typical Alternatives": [
    "best budget desk lamp",
    "LED task lamp comparison",
  ],
  "Bottom Line": ["best LED desk lamp for home office"],
  "First Impressions": ["home office setup", "desk lighting first look"],
  "Build Quality and Design": ["metal desk lamp", "adjustable arm"],
  "Performance in Daily Use": [
    "home office productivity",
    "reading light",
  ],
  "Who Should Buy It": ["remote workers", "students", "craft desk"],
  "Final Verdict": ["worth buying", "value for money"],
  "Why This Product Matters": ["ergonomic lighting", "workspace comfort"],
  "Detailed Feature Analysis": ["brightness levels", "color modes"],
  "Real-World Pros and Cons": ["daily use", "long sessions"],
  "Value for Money": ["affordable desk lamp", "price vs features"],
  "Recommendation": ["who should buy", "best use cases"],
  "The Problem It Solves": ["eye fatigue", "poor desk lighting"],
  "Setup and Usability": ["easy setup", "touch controls"],
  "Strengths Worth Paying For": ["standout features", "build quality"],
  "Weaknesses You Should Know": ["trade-offs", "missing features"],
  "Should You Buy It?": ["final recommendation", "best for"],
};

export function buildSectionKeywordGuidance(
  templateId: string,
  targetKeyword: string,
): string {
  const template =
    REVIEW_STRUCTURE_TEMPLATES.find((item) => item.id === templateId) ??
    REVIEW_STRUCTURE_TEMPLATES[0];

  const lines = template.sections.map((section) => {
    const hints = SECTION_KEYWORD_HINTS[section] ?? [];
    const hintText =
      hints.length > 0
        ? hints.join(", ")
        : "related long-tail terms for this section";

    return `- ## ${section}: use H2 exactly as written; naturally include terms like ${hintText}. Do not repeat "${targetKeyword}" in every heading.`;
  });

  return [
    "H2 keyword guidance (semantic coverage — avoid stuffing the primary keyword into every heading):",
    ...lines,
    `- Use the exact primary keyword "${targetKeyword}" in the body at least once; the Bottom Line / Final Verdict / Recommendation section is the best place for a natural repeat.`,
  ].join("\n");
}

export function buildReviewTitleGuidance(input: ReviewGenerationInput): string {
  return `Title guidance: lead with the primary keyword or a close variant once (e.g. "${input.targetKeyword}"), then the product name. Keep under 70 characters when possible. Do not stack duplicate questions like "Is This the Best... Is This the Best...".`;
}
