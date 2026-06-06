import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";

import {
  getGeminiApiKey,
  getGeminiModelDraft,
  getGeminiModelFinal,
} from "@/lib/settings/runtime-config";

function extractGeminiResponseText(
  response: GenerateContentResponse,
): string | undefined {
  const direct = response.text?.trim();
  if (direct) {
    return direct;
  }

  const segments: string[] = [];

  for (const candidate of response.candidates ?? []) {
    for (const support of candidate.groundingMetadata?.groundingSupports ?? []) {
      const text = support.segment?.text?.trim();
      if (text) {
        segments.push(text);
      }
    }
  }

  if (segments.length > 0) {
    return [...new Set(segments)].join("\n\n");
  }

  return undefined;
}

function buildGroundingResearchFallback(
  response: GenerateContentResponse,
): string | undefined {
  const metadata = response.candidates?.[0]?.groundingMetadata;
  if (!metadata) {
    return undefined;
  }

  const lines: string[] = [];

  if (metadata.webSearchQueries?.length) {
    lines.push(
      `Google search queries used: ${metadata.webSearchQueries.join("; ")}`,
    );
  }

  for (const chunk of metadata.groundingChunks ?? []) {
    const web = chunk.web;
    const context = chunk.retrievedContext;

    if (web?.uri) {
      lines.push(`- ${web.title ?? "Web result"}: ${web.uri}`);
    }

    if (context?.text?.trim()) {
      lines.push(context.text.trim());
    } else if (context?.uri) {
      lines.push(`- ${context.title ?? "Source"}: ${context.uri}`);
    }
  }

  const joined = lines.join("\n").trim();
  return joined.length > 0 ? joined : undefined;
}

function describeEmptyGeminiResponse(response: GenerateContentResponse): string {
  const candidate = response.candidates?.[0];
  const blockReason = response.promptFeedback?.blockReason;

  if (blockReason) {
    return `Gemini blocked the discovery request (${blockReason})`;
  }

  const finishReason = candidate?.finishReason;

  if (
    finishReason &&
    finishReason !== "STOP" &&
    finishReason !== "FINISH_REASON_UNSPECIFIED"
  ) {
    const detail = candidate.finishMessage ? `: ${candidate.finishMessage}` : "";
    return `Gemini stopped discovery research (${finishReason}${detail})`;
  }

  if (!response.candidates?.length) {
    return "Gemini returned no candidates for discovery research";
  }

  return "Gemini returned empty discovery research";
}

const DISCOVERY_SEARCH_RETRY_SUFFIX =
  "\n\nIMPORTANT: After searching, you MUST write detailed plain-text research notes in your reply (numbered product sections with ASINs, prices, ratings, and search queries used). Do not reply with only tool calls and no text.";

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

  let searchResponse: GenerateContentResponse | undefined;
  let researchText: string | undefined;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    searchResponse = await ai.models.generateContent({
      model: searchModel,
      contents:
        attempt === 0
          ? input.searchPrompt
          : `${input.searchPrompt}${DISCOVERY_SEARCH_RETRY_SUFFIX}`,
      config: {
        temperature: 0.25,
        tools: [{ googleSearch: {} }],
      },
    });

    researchText =
      extractGeminiResponseText(searchResponse) ??
      buildGroundingResearchFallback(searchResponse);

    if (researchText) {
      break;
    }
  }

  if (!researchText) {
    throw new Error(
      describeEmptyGeminiResponse(
        searchResponse ??
          ({ candidates: [] } as unknown as GenerateContentResponse),
      ),
    );
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
        (searchResponse?.usageMetadata?.promptTokenCount ?? 0) +
        (structured.usage?.promptTokens ?? 0),
      outputTokens:
        (searchResponse?.usageMetadata?.candidatesTokenCount ?? 0) +
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

  const text =
    extractGeminiResponseText(response) ?? response.text?.trim();

  if (!text) {
    throw new Error(describeEmptyGeminiResponse(response));
  }

  let data: T;

  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error("Gemini returned invalid JSON during discovery structure step");
  }

  return {
    data,
    text,
    usage: {
      promptTokens: response.usageMetadata?.promptTokenCount,
      outputTokens: response.usageMetadata?.candidatesTokenCount,
    },
  };
}
