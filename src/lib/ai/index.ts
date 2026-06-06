import { generateReviewWithGemini } from "@/lib/ai/generate-review";
import { generateMockReview } from "@/lib/ai/mock/generate-review";
import { pickReviewTemplate } from "@/lib/ai/prompts/build-prompt";
import type {
  ReviewGenerationInput,
  ReviewGenerationResult,
} from "@/lib/ai/types";
import { shouldUseGeminiMock } from "@/lib/settings/runtime-config";

export async function generateProductReview(
  input: ReviewGenerationInput,
): Promise<ReviewGenerationResult> {
  const templateId = input.templateId || pickReviewTemplate().id;
  const payload = { ...input, templateId };

  if (await shouldUseGeminiMock()) {
    return generateMockReview(payload);
  }

  return generateReviewWithGemini(payload);
}
