import { generateJson, getReviewGenerationModel } from "@/lib/ai/gemini/client";
import { normalizeMetaDescription, normalizeReviewTitle, stripProhibitedPhrases } from "@/lib/ai/constants";
import {
  buildReviewPrompt,
  generatedReviewJsonSchema,
  pickReviewTemplate,
} from "@/lib/ai/prompts/build-prompt";
import {
  generatedReviewSchema,
  type GeneratedReview,
  type ReviewGenerationInput,
  type ReviewGenerationResult,
} from "@/lib/ai/types";

export async function generateReviewWithGemini(
  input: ReviewGenerationInput,
): Promise<ReviewGenerationResult> {
  const templateId = input.templateId || pickReviewTemplate().id;
  const prompt = buildReviewPrompt({ ...input, templateId });
  const model = await getReviewGenerationModel();

  const response = await generateJson<GeneratedReview>({
    model,
    prompt,
    schema: generatedReviewJsonSchema,
  });

  const review = generatedReviewSchema.parse({
    ...response.data,
    title: normalizeReviewTitle(response.data.title, input.targetKeyword),
    metaDescription: normalizeMetaDescription(response.data.metaDescription),
    content: stripProhibitedPhrases(response.data.content),
  });

  return {
    review,
    model,
    mode: "live",
    templateId,
    usage: response.usage,
  };
}
