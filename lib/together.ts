/**
 * Together chat model used for card readings, synthesis, and follow-ups.
 *
 * `meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` was removed from
 * serverless inference on 2026-03-31. Calling it returns
 * `model_not_available`, which the reading page treats as every card failing.
 * Muse Glimmer 30B is Together's current Meta serverless chat model.
 */
export const CHAT_MODEL = 'meta-models/Muse-Glimmer-30B';

export const RETIRED_SERVERLESS_CHAT_MODEL =
  'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8';

/**
 * Muse still spends completion tokens on reasoning before the visible JSON.
 * 380 tokens (the old card budget) comes back with an empty `content` field.
 */
export const CARD_READING_MAX_TOKENS = 1400;
export const SYNTHESIS_MAX_TOKENS = 2000;
export const FOLLOWUP_MAX_TOKENS = 800;

type ChatMessage = { role: string; content: string };

export function chatCompletionBody(args: {
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  stream?: boolean;
}) {
  return {
    model: CHAT_MODEL,
    messages: args.messages,
    temperature: args.temperature,
    max_tokens: args.maxTokens,
    stream: args.stream ?? false,
    reasoning: { enabled: false },
  };
}

export type TogetherFailure = {
  scope: string;
  model: string;
  status: number;
  providerCode: string | null;
  providerMessage: string;
};

export function describeTogetherFailure(
  scope: string,
  model: string,
  status: number,
  body: string,
): TogetherFailure {
  let providerCode: string | null = null;
  let providerMessage = body.replace(/\s+/g, ' ').trim().slice(0, 500);

  try {
    const parsed = JSON.parse(body) as {
      error?: { code?: unknown; message?: unknown };
      message?: unknown;
    };
    const err = parsed?.error;
    if (err && typeof err === 'object') {
      if (typeof err.code === 'string') providerCode = err.code;
      if (typeof err.message === 'string') providerMessage = err.message.slice(0, 500);
    } else if (typeof parsed?.message === 'string') {
      providerMessage = parsed.message.slice(0, 500);
    }
  } catch {
    // Provider body was not JSON. Keep the truncated text.
  }

  return { scope, model, status, providerCode, providerMessage };
}

export function logTogetherFailure(failure: TogetherFailure) {
  console.error(
    `${failure.scope}: Together request failed model=${failure.model} status=${failure.status} code=${failure.providerCode ?? 'unknown'} message=${failure.providerMessage}`,
  );
}
