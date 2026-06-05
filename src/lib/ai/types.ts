import { z } from "zod";

export const generatedReviewSchema = z.object({
  title: z.string().min(10).max(300),
  metaDescription: z.string().min(120).max(160),
  content: z.string().min(500),
  pros: z.array(z.string()).min(3),
  cons: z.array(z.string()).min(3),
  rating: z.number().min(1).max(5),
  targetKeyword: z.string().min(3),
});

export type GeneratedReview = z.infer<typeof generatedReviewSchema>;

export interface ReviewGenerationInput {
  product: {
    id: string;
    title: string;
    description?: string | null;
    price?: string | null;
    currency: string;
    specs: Record<string, unknown>;
    affiliateLink: string;
    externalId: string;
  };
  author: {
    name: string;
    title?: string | null;
    bio?: string | null;
    credentials: unknown;
  };
  targetKeyword: string;
  templateId: string;
  siteName: string;
}

export interface ReviewGenerationResult {
  review: GeneratedReview;
  model: string;
  mode: "live" | "mock";
  templateId: string;
  usage?: {
    promptTokens?: number;
    outputTokens?: number;
  };
}

export interface QualityGateInput {
  review: GeneratedReview;
  productSpecs: Record<string, unknown>;
  existingReviewContents: string[];
  productTitle?: string;
  externalId?: string;
}

export interface QualityGateResult {
  passed: boolean;
  wordCountScore: number;
  uniquenessScore: number;
  specAccuracyScore: number;
  seoScore: number;
  overallScore: number;
  checklist: Record<string, boolean>;
  wordCount: number;
}
