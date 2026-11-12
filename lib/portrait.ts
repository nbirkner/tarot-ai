import { NextResponse } from 'next/server';
import { takeSpend } from './reading-quota';
import { describeTogetherFailure, logTogetherFailure } from './together';

/**
 * Vision model used only when Kontext refuses the uploaded photo.
 * Nemotron 3.5 Super VL is a serverless model this key can call.
 * Input $0.15 / 1M tokens, output $0.50 / 1M tokens.
 */
export const PORTRAIT_MODEL = 'nvidia/NVIDIA-Nemotron-3.5-Super-VL';

export const PORTRAIT_INPUT_USD_PER_MILLION = 0.15;
export const PORTRAIT_OUTPUT_USD_PER_MILLION = 0.5;

/** A 512px photo is well under this many vision tokens. */
export const PORTRAIT_IMAGE_TOKENS = 2500;
export const PORTRAIT_MAX_OUTPUT_TOKENS = 180;

const PORTRAIT_INSTRUCTION =
  'Describe the person in this photo for an illustrator in one sentence: hair, complexion, approximate age range, and clothing. Do not guess a name. Do not invent traits you cannot see.';

export function estimatePortraitMicrodollars(instructionChars: number): number {
  const inputTokens = PORTRAIT_IMAGE_TOKENS + Math.ceil(Math.max(0, instructionChars) / 2);
  return Math.ceil(
    inputTokens * PORTRAIT_INPUT_USD_PER_MILLION +
      PORTRAIT_MAX_OUTPUT_TOKENS * PORTRAIT_OUTPUT_USD_PER_MILLION,
  );
}

export function cleanPortrait(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, 400);
  if (!text) return null;
  if (/data:image/i.test(text) || /https?:\/\//i.test(text)) return null;
  return text;
}

export type PortraitResult =
  | { ok: true; description: string | null }
  | { ok: false; response: NextResponse };

/**
 * One vision call, billed against the same daily cap as the picture.
 * A failure here means "draw the card without a likeness", not "stop the reading",
 * unless the spend cap or the limit store refused the call.
 */
export async function describePortrait(photoDataUri: string): Promise<PortraitResult> {
  if (!process.env.TOGETHER_API_KEY) return { ok: true, description: null };
  if (!photoDataUri.startsWith('data:image/') || photoDataUri.length > 2_000_000) {
    return { ok: true, description: null };
  }

  const estimate = estimatePortraitMicrodollars(PORTRAIT_INSTRUCTION.length);
  const spend = await takeSpend(estimate);
  if (!spend.ok) return { ok: false, response: spend.response };

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'tarot-ai',
      },
      body: JSON.stringify({
        model: PORTRAIT_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PORTRAIT_INSTRUCTION },
              { type: 'image_url', image_url: { url: photoDataUri } },
            ],
          },
        ],
        max_tokens: PORTRAIT_MAX_OUTPUT_TOKENS,
        temperature: 0.2,
        reasoning: { enabled: false },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      await spend.settle(0);
      logTogetherFailure(
        describeTogetherFailure('generate-card-portrait', PORTRAIT_MODEL, response.status, error),
      );
      return { ok: true, description: null };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const promptTokens = Math.max(0, data.usage?.prompt_tokens ?? 0);
    const completionTokens = Math.max(0, data.usage?.completion_tokens ?? 0);
    const actual =
      data.usage && typeof data.usage.prompt_tokens === 'number'
        ? Math.ceil(
            promptTokens * PORTRAIT_INPUT_USD_PER_MILLION +
              completionTokens * PORTRAIT_OUTPUT_USD_PER_MILLION,
          )
        : estimate;
    await spend.settle(Math.min(estimate, actual));
    return { ok: true, description: cleanPortrait(data.choices?.[0]?.message?.content) };
  } catch (err) {
    await spend.settle(0);
    console.error(
      'generate-card-portrait failed',
      err instanceof Error ? err.name : 'Error',
    );
    return { ok: true, description: null };
  }
}
