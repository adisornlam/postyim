import type { ReviewGenerationInput } from "@/lib/ai/types";
import {
  DEFAULT_DISCLOSURE,
  PROHIBITED_PHRASES,
  REVIEW_STRUCTURE_TEMPLATES,
} from "@/lib/ai/constants";

function formatSpecs(specs: Record<string, unknown>): string {
  return JSON.stringify(specs, null, 2);
}

function formatCredentials(credentials: unknown): string {
  if (!Array.isArray(credentials)) {
    return "None listed";
  }

  return credentials.map(String).join("; ");
}

export function pickReviewTemplate() {
  const index = Math.floor(Math.random() * REVIEW_STRUCTURE_TEMPLATES.length);
  return REVIEW_STRUCTURE_TEMPLATES[index];
}

export function buildReviewPrompt(input: ReviewGenerationInput): string {
  const template = REVIEW_STRUCTURE_TEMPLATES.find(
    (item) => item.id === input.templateId,
  ) ?? REVIEW_STRUCTURE_TEMPLATES[0];

  return `
You are ${input.author.name}${input.author.title ? `, ${input.author.title}` : ""}.
Write as an experienced human reviewer with genuine perspective, not as an AI assistant.

Author bio:
${input.author.bio ?? "Experienced product reviewer."}

Author credentials:
${formatCredentials(input.author.credentials)}

Product to review:
- Title: ${input.product.title}
- ASIN: ${input.product.externalId}
- Price: ${input.product.price ?? "See Amazon"} ${input.product.currency}
- Short description: ${input.product.description ?? "N/A"}
- Specs JSON:
${formatSpecs(input.product.specs)}

Target SEO keyword: ${input.targetKeyword}
Site name: ${input.siteName}

Writing template: ${template.id}
Opening style: ${template.openingStyle}
Section order (use these as H2 headings):
${template.sections.map((section, index) => `${index + 1}. ${section}`).join("\n")}

Requirements:
- Write in English for a global audience.
- Minimum 1,500 words in the content body.
- Use markdown with H2 headings matching the section order above.
- After each major H2 section, include one editorial photo using markdown image syntax:
  ![descriptive alt text](https://example.com/photo.jpg "Short caption for the reader")
- Use realistic alt text and captions tied to the section topic. Do not leave long text-only sections without a visual break.
- Do NOT expose internal SEO labels such as "Target keyword" in the content body.
- Put the affiliate disclosure only once near the end of the article body.
- Include practical analysis grounded in the product specs and features.
- Provide at least 3 specific pros and 3 specific cons tied to real product attributes.
- Assign a decimal rating between 1.0 and 5.0 with clear justification in the content.
- Include this affiliate disclosure verbatim somewhere in the content body:
"${DEFAULT_DISCLOSURE}"
- Meta description must be between 120 and 160 characters and include the target keyword naturally.
- Do NOT use these phrases: ${PROHIBITED_PHRASES.join(", ")}
- Do NOT mention AI, language models, or that the text was generated.
- Do NOT use generic filler openers like "In conclusion" or "Look no further".
- Write with varied sentence rhythm, concrete examples, and a confident editorial voice.

Return JSON with:
- title
- metaDescription
- content
- pros (string array)
- cons (string array)
- rating (number)
- targetKeyword (string)
`.trim();
}

export const generatedReviewJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    metaDescription: { type: "string" },
    content: { type: "string" },
    pros: {
      type: "array",
      items: { type: "string" },
    },
    cons: {
      type: "array",
      items: { type: "string" },
    },
    rating: { type: "number" },
    targetKeyword: { type: "string" },
  },
  required: [
    "title",
    "metaDescription",
    "content",
    "pros",
    "cons",
    "rating",
    "targetKeyword",
  ],
} as const;
