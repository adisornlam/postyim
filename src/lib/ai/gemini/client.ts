import { GoogleGenAI } from "@google/genai";

import {
  getGeminiApiKey,
  getGeminiModelDraft,
  getGeminiModelFinal,
} from "@/lib/env";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Set it in .env.local or enable GEMINI_MOCK=true.",
    );
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
}

export function getReviewGenerationModel(): string {
  return getGeminiModelFinal();
}

export function getQualityEvaluationModel(): string {
  return getGeminiModelDraft();
}

export async function generateJson<T>(input: {
  model: string;
  prompt: string;
  schema: Record<string, unknown>;
}): Promise<{ data: T; text: string; usage?: { promptTokens?: number; outputTokens?: number } }> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: input.model,
    contents: input.prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: input.schema,
      temperature: 0.8,
    },
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return {
    data: JSON.parse(text) as T,
    text,
    usage: {
      promptTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    },
  };
}
