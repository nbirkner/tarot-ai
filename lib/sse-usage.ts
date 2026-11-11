import { settleMicro, type ChatUsage } from './spend';

export function usageFromSseBuffer(block: string): ChatUsage | null {
  let found: ChatUsage | null = null;
  for (const line of block.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    try {
      const json = JSON.parse(payload) as { usage?: ChatUsage };
      if (json.usage && typeof json.usage.prompt_tokens === 'number') found = json.usage;
    } catch {
      // A partial SSE line is completed on a later chunk.
    }
  }
  return found;
}

/**
 * Forward a Together SSE body and settle the reservation when the stream
 * ends. Missing usage keeps the full estimate, which is an upper bound.
 */
export function billTogetherStream(
  upstream: ReadableStream<Uint8Array>,
  estimateMicro: number,
  settle: (actualMicro: number) => Promise<void>,
): ReadableStream<Uint8Array> {
  const reader = upstream.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let usage: ChatUsage | null = null;
  let closed = false;

  async function finish() {
    if (closed) return;
    closed = true;
    await settle(settleMicro(estimateMicro, usage));
  }

  function note(block: string) {
    const found = usageFromSseBuffer(block);
    if (found) usage = found;
  }

  return new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          pending += decoder.decode();
          note(pending);
          await finish();
          controller.close();
          return;
        }
        pending += decoder.decode(value, { stream: true });
        const splitAt = pending.lastIndexOf('\n');
        if (splitAt >= 0) {
          note(pending.slice(0, splitAt));
          pending = pending.slice(splitAt + 1);
        }
        controller.enqueue(value);
      } catch (err) {
        await finish();
        controller.error(err);
      }
    },
    async cancel(reason) {
      await finish();
      await reader.cancel(reason);
    },
  });
}
