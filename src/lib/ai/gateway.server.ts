// Server-only Lovable AI Gateway access: embeddings + structured generation.
import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import type { z } from "zod";

export const GATEWAY_URL = "https://ai.gateway.lovable.dev";
export const CHAT_MODEL = "openai/gpt-6-astra";
export const EMBEDDING_MODEL = "google/gemini-embedding-2";
export const EMBEDDING_DIMS = 3072;

export class GatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function apiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new GatewayError(401, "AI is not configured (missing LOVABLE_API_KEY).");
  return key;
}

function createRunIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
    return res;
  };
}

/** Embed texts in bounded batches with retry on 429/5xx only. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const key = apiKey();
  const out: number[][] = [];
  const BATCH = 32;
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    let res: Response | undefined;
    for (let attempt = 1; attempt <= 4; attempt++) {
      res = await fetch(`${GATEWAY_URL}/v1/embeddings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: batch }),
      });
      const retryable = res.status === 429 || res.status >= 500;
      if (res.ok || !retryable || attempt === 4) break;
      await res.body?.cancel();
      const ra = Number(res.headers.get("Retry-After"));
      await new Promise((r) => setTimeout(r, (ra > 0 ? ra * 1000 : 1000 * 2 ** attempt) + Math.random() * 500));
    }
    if (!res!.ok) throw new GatewayError(res!.status, await safeMessage(res!));
    const json = (await res!.json()) as { data: { index: number; embedding: number[] }[] };
    const ordered: number[][] = new Array(batch.length);
    for (const d of json.data) ordered[d.index] = d.embedding;
    for (const v of ordered) {
      if (!v || v.length !== EMBEDDING_DIMS) throw new GatewayError(500, "Invalid embedding response");
      out.push(v);
    }
  }
  return out;
}

async function safeMessage(res: Response) {
  try {
    const j = (await res.json()) as { message?: string; error?: { message?: string } };
    return j.message ?? j.error?.message ?? `AI request failed (${res.status})`;
  } catch {
    return `AI request failed (${res.status})`;
  }
}

/** Streams a structured-output Responses call and returns the validated object. */
export async function generateStructured<T>(args: {
  instructions: string;
  prompt: string;
  schema: z.ZodType<T>;
  abortSignal?: AbortSignal;
}): Promise<{ object: T; inputTokens: number | null; outputTokens: number | null }> {
  const key = apiKey();
  const provider = createOpenAI({
    baseURL: `${GATEWAY_URL}/v1`,
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: createRunIdFetch(),
  });
  let streamError: unknown;
  const result = streamText({
    model: provider.responses(CHAT_MODEL),
    instructions: args.instructions,
    prompt: args.prompt,
    output: Output.object({ schema: args.schema }),
    ...(args.abortSignal ? { abortSignal: args.abortSignal } : {}),
    onError: ({ error }) => {
      streamError = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  try {
    const object = (await result.output) as T;
    const usage = await result.usage;
    return { object, inputTokens: usage.inputTokens ?? null, outputTokens: usage.outputTokens ?? null };
  } catch (e) {
    const err = (streamError ?? e) as { statusCode?: number; message?: string };
    throw new GatewayError(err.statusCode ?? 500, err.message ?? "AI generation failed");
  }
}
