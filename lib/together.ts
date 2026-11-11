/**
 * Together chat model used for card readings, synthesis, and follow-ups.
 *
 * Muse Glimmer 30B spends the first part of the stream on reasoning and can
 * emit no visible `delta.content` before the client's 45s hang timer.
 * Qwen3.5 9B is a fast serverless chat model. Requests still disable
 * reasoning so the first tokens are the JSON the page renders.
 */
export const CHAT_MODEL = 'Qwen/Qwen3.5-9B';

export const RETIRED_SERVERLESS_CHAT_MODEL =
  'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8';

export const RETIRED_REASONING_CHAT_MODEL = 'meta-models/Muse-Glimmer-30B';

/** Sentence shown when Together refuses the call with 403. */
export const PROVIDER_BLOCKED_MESSAGE =
  'The model host refused this request. Please try again later.';

/**
 * Completion budget for one card. Qwen3.5 9B is not asked to reason, and
 * the JSON still needs room for a full interpretation.
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
    ...(args.stream ? { stream_options: { include_usage: true } } : {}),
  };
}

/** Drop data URLs and long base64 blobs before anything is written to logs. */
export function redactSensitive(text: string): string {
  return text
    .replace(/data:image\/[a-z0-9.+-]+;base64,[^\s"]+/gi, '[redacted-image]')
    .replace(/\b[A-Za-z0-9+/]{80,}={0,2}\b/g, '[redacted]');
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
  let providerMessage = redactSensitive(body.replace(/\s+/g, ' ').trim()).slice(0, 500);

  try {
    const parsed = JSON.parse(body) as {
      error?: { code?: unknown; message?: unknown };
      message?: unknown;
    };
    const err = parsed?.error;
    if (err && typeof err === 'object') {
      if (typeof err.code === 'string') providerCode = err.code;
      if (typeof err.message === 'string') providerMessage = redactSensitive(err.message).slice(0, 500);
    } else if (typeof parsed?.message === 'string') {
      providerMessage = redactSensitive(parsed.message).slice(0, 500);
    }
  } catch {
    // Provider body was not JSON. Keep the truncated text.
  }

  return { scope, model, status, providerCode, providerMessage };
}

/** Together 403, including third_party_data_sharing_blocked, will not succeed on retry. */
export function togetherRequestIsBlocked(status: number, providerCode: string | null): boolean {
  return status === 403 || providerCode === 'third_party_data_sharing_blocked';
}

export function logTogetherFailure(failure: TogetherFailure) {
  console.error(
    `${failure.scope}: Together request failed model=${failure.model} status=${failure.status} code=${failure.providerCode ?? 'unknown'} message=${failure.providerMessage}`,
  );
}
