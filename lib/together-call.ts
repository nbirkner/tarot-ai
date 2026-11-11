import { NextResponse } from 'next/server';
import { takeSpend } from './reading-quota';
import { estimateMessagesMicro, settleMicro, type ChatUsage } from './spend';
import { billTogetherStream } from './sse-usage';
import { chatCompletionBody, describeTogetherFailure, logTogetherFailure, type TogetherFailure } from './together';

type ChatMessage = { role: string; content: string };

export type TogetherChatJson = {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  usage?: ChatUsage;
};

export type PaidChatResult =
  | { ok: true; mode: 'stream'; response: Response }
  | { ok: true; mode: 'json'; data: TogetherChatJson }
  | { ok: false; response: NextResponse; failure?: TogetherFailure };

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  'X-Accel-Buffering': 'no',
  Connection: 'keep-alive',
};

/**
 * Reserve the chat estimate, call Together, then settle to token usage.
 * Callers must already have passed the per-IP reading limit.
 */
export async function paidChat(args: {
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  stream: boolean;
  scope: string;
  signal?: AbortSignal;
}): Promise<PaidChatResult> {
  if (!process.env.TOGETHER_API_KEY) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'API key not configured' }, { status: 500 }),
    };
  }

  const estimate = estimateMessagesMicro(args.messages, args.maxTokens);
  const spend = await takeSpend(estimate);
  if (!spend.ok) return { ok: false, response: spend.response };

  const chatBody = chatCompletionBody({
    messages: args.messages,
    temperature: args.temperature,
    maxTokens: args.maxTokens,
    stream: args.stream,
  });

  try {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: args.signal,
      body: JSON.stringify(chatBody),
    });

    if (!response.ok) {
      const error = await response.text();
      await spend.settle(0);
      const failure = describeTogetherFailure(args.scope, chatBody.model, response.status, error);
      logTogetherFailure(failure);
      return {
        ok: false,
        failure,
        response: NextResponse.json(
          {
            error: 'upstream',
            providerStatus: failure.status,
            providerCode: failure.providerCode,
          },
          { status: 500 },
        ),
      };
    }

    if (args.stream) {
      if (!response.body) {
        await spend.settle(0);
        return {
          ok: false,
          response: NextResponse.json({ error: 'Empty response' }, { status: 502 }),
        };
      }
      return {
        ok: true,
        mode: 'stream',
        response: new Response(billTogetherStream(response.body, estimate, spend.settle), {
          headers: SSE_HEADERS,
        }),
      };
    }

    const data = (await response.json()) as TogetherChatJson | null;
    await spend.settle(settleMicro(estimate, data?.usage ?? null));
    return { ok: true, mode: 'json', data: data ?? {} };
  } catch (err) {
    await spend.settle(0);
    throw err;
  }
}
