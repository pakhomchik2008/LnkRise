import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

/**
 * One seam for every AI call in the app.
 *
 * With ANTHROPIC_API_KEY set, requests go to Claude and the response is
 * validated against the same Zod schema the mock engine satisfies. Without it,
 * callers fall back to `src/lib/ai/mock` — the app is fully usable either way,
 * and nothing outside this module knows which path ran.
 */

export const AI_MODEL = "claude-opus-5";

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export interface GenerateJsonOptions<T> {
  system: string;
  prompt: string;
  /** JSON Schema the model is constrained to. Must set additionalProperties: false. */
  jsonSchema: Record<string, unknown>;
  /** Zod schema used to validate what actually came back. */
  validator: z.ZodType<T>;
  maxTokens?: number;
  effort?: "low" | "medium" | "high";
}

export class AiUnavailableError extends Error {
  constructor(message = "No ANTHROPIC_API_KEY configured") {
    super(message);
    this.name = "AiUnavailableError";
  }
}

/**
 * Structured generation. Returns a value that has passed Zod validation, or
 * throws — callers decide whether to fall back to the mock engine.
 */
export async function generateJson<T>({
  system,
  prompt,
  jsonSchema,
  validator,
  maxTokens = 8000,
  effort = "medium",
}: GenerateJsonOptions<T>): Promise<T> {
  if (!hasAnthropicKey()) throw new AiUnavailableError();

  const response = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: maxTokens,
    system,
    output_config: {
      effort,
      format: { type: "json_schema", schema: jsonSchema },
    },
    messages: [{ role: "user", content: prompt }],
  });

  // Safety classifiers can decline a request: HTTP 200, stop_reason "refusal",
  // empty or partial content. Check before touching content.
  if (response.stop_reason === "refusal") {
    throw new Error("The model declined this request.");
  }

  const text = response.content.find((block) => block.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("Model returned no text block");
  }

  return validator.parse(JSON.parse(text.text));
}

/**
 * Runs `live` when a key is present and the response validates; otherwise
 * returns `fallback()`. Every AI-backed feature in the app goes through this.
 */
export async function withFallback<T>(
  live: () => Promise<T>,
  fallback: () => T,
): Promise<{ value: T; source: "ai" | "mock" }> {
  if (!hasAnthropicKey()) return { value: fallback(), source: "mock" };

  try {
    return { value: await live(), source: "ai" };
  } catch (error) {
    console.warn("[ai] falling back to the mock engine:", error);
    return { value: fallback(), source: "mock" };
  }
}
