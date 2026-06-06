import { GoogleGenAI } from "@google/genai";

import {
  getGeminiApiKey,
  getGeminiModelDraft,
  getGeminiModelFinal,
} from "@/lib/settings/runtime-config";

let client: GoogleGenAI | null = null;
let clientKey: string | null = null;

export function resetGeminiClient() {
  client = null;
  clientKey = null;
}

export async function getGeminiClient(): Promise<GoogleGenAI> {
  const apiKey = await getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      "Gemini API key is not configured. Connect it in Admin → Settings → Integrations.",
    );
  }

  if (!client || clientKey !== apiKey) {
    client = new GoogleGenAI({ apiKey });
    clientKey = apiKey;
  }

  return client;
}

export async function getReviewGenerationModel(): Promise<string> {
  return getGeminiModelFinal();
}

export async function getQualityEvaluationModel(): Promise<string> {
  return getGeminiModelDraft();
}

export async function generateDiscoveryJson<T>(input: {
  model: string;
  searchModel?: string;
  searchPrompt: string;
  structurePrompt: string;
  schema: Record<string, unknown>;
  onSearchComplete?: (researchText: string) => void | Promise<void>;
  onStructureStart?: () => void | Promise<void>;
}): Promise<{ data: T; text: string; usage?: { promptTokens?: number; outputTokens?: number } }> {
  const ai = await getGeminiClient();
  const searchModel = input.searchModel ?? input.model;

  const searchResponse = await ai.models.generateContent({
    model: searchModel,
    contents: input.searchPrompt,
    config: {
      temperature: 0.25,
      tools: [{ googleSearch: {} }],
    },
  });

  const researchText = searchResponse.text?.trim();

  if (!researchText) {
    throw new Error("Gemini returned empty discovery research");
  }

  await input.onSearchComplete?.(researchText);

  await input.onStructureStart?.();

  const structured = await generateJson<T>({
    model: input.model,
    prompt: `${input.structurePrompt}\n\n---\nResearch notes:\n${researchText}`,
    schema: input.schema,
  });

  return {
    data: structured.data,
    text: structured.text,
    usage: {
      promptTokens:
        (searchResponse.usageMetadata?.promptTokenCount ?? 0) +
        (structured.usage?.promptTokens ?? 0),
      outputTokens:
        (searchResponse.usageMetadata?.candidatesTokenCount ?? 0) +
        (structured.usage?.outputTokens ?? 0),
    },
  };
}

export async function generateJson<T>(input: {
  model: string;
  prompt: string;
  schema: Record<string, unknown>;
}): Promise<{ data: T; text: string; usage?: { promptTokens?: number; outputTokens?: number } }> {
  const ai = await getGeminiClient();

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
