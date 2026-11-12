import assert from 'node:assert/strict';
import fs from 'node:fs';
import { afterEach, describe, it } from 'node:test';
import { NextRequest } from 'next/server';
import { POST as generateCard } from '../app/api/generate-card/route.ts';
import { POST as generateCardReading } from '../app/api/generate-card-reading/route.ts';
import { POST as generateFollowUps } from '../app/api/generate-follow-ups/route.ts';
import { POST as generateReading } from '../app/api/generate-reading/route.ts';
import { POST as generateSynthesis } from '../app/api/generate-synthesis/route.ts';
import { setReadingQuotaForTests } from './rate-limit.ts';
import { createMemoryQuota, MAX_IMAGE_CALLS_PER_READING, SPEND_CAP_MESSAGE } from './rate-limit-shared.ts';
import { setSpendRedisForTests, type RedisEval } from './spend.ts';

const PAID_POSTS = [
  generateCard,
  generateCardReading,
  generateFollowUps,
  generateReading,
  generateSynthesis,
];

const originalFetch = globalThis.fetch;
const previousKey = process.env.TOGETHER_API_KEY;
const previousCap = process.env.TAROT_DAILY_SPEND_CAP_CENTS;

function request(ip: string, readingId: string, body: unknown = {}) {
  return new NextRequest('http://localhost/api/paid', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
      'x-reading-id': readingId,
    },
    body: JSON.stringify(body),
  });
}

function allowingSpend(): RedisEval {
  return async () => [1, 0];
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  setReadingQuotaForTests(null);
  setSpendRedisForTests(null);
  if (previousKey === undefined) delete process.env.TOGETHER_API_KEY;
  else process.env.TOGETHER_API_KEY = previousKey;
  if (previousCap === undefined) delete process.env.TAROT_DAILY_SPEND_CAP_CENTS;
  else process.env.TAROT_DAILY_SPEND_CAP_CENTS = previousCap;
});

describe('paid routes', () => {
  it('blocks a direct call to every Together route once the IP limit is spent', async () => {
    const quota = createMemoryQuota({ perIpPerHour: 1, perIpPerDay: 5, globalPerDay: 20 });
    await quota.consume('203.0.113.50', 'seed-reading', Date.now(), 'image');
    setReadingQuotaForTests(quota);
    setSpendRedisForTests(allowingSpend());
    process.env.TOGETHER_API_KEY = 'test-key';
    process.env.TAROT_DAILY_SPEND_CAP_CENTS = '200';

    let fetches = 0;
    globalThis.fetch = async () => {
      fetches += 1;
      throw new Error('Together should not be called');
    };

    for (const [index, post] of PAID_POSTS.entries()) {
      const response = await post(request('203.0.113.50', `fresh-reading-${index}`));
      assert.equal(response.status, 429, `route ${index}`);
      const body = await response.json();
      assert.equal(body.error, 'rate_limited');
    }
    assert.equal(fetches, 0);
  });

  it('still allows the other calls in the same reading', async () => {
    const quota = createMemoryQuota({ perIpPerHour: 1, perIpPerDay: 5, globalPerDay: 20 });
    setReadingQuotaForTests(quota);
    setSpendRedisForTests(allowingSpend());
    process.env.TOGETHER_API_KEY = 'test-key';
    process.env.TAROT_DAILY_SPEND_CAP_CENTS = '200';

    let fetches = 0;
    globalThis.fetch = async () => {
      fetches += 1;
      return new Response(JSON.stringify({ data: [{ url: 'https://api.together.ai/card.png' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const image = await generateCard(
      request('203.0.113.60', 'reading-shared', { cardName: 'The Fool', deckStyle: 'classic' }),
    );
    assert.equal(image.status, 200);
    assert.equal(fetches, 1);

    globalThis.fetch = async () => {
      fetches += 1;
      return new Response('data: {"choices":[{"delta":{"content":"ok"}}]}\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });
    };
    const text = await generateCardReading(
      request('203.0.113.60', 'reading-shared', {
        card: 'The Fool',
        position: 'Present',
        spreadPositions: ['Present'],
        otherCards: [],
      }),
    );
    assert.equal(text.status, 200);
    assert.equal(fetches, 2);

    const bypass = await generateFollowUps(
      request('203.0.113.60', 'reading-other', { question: 'What now?' }),
    );
    assert.equal(bypass.status, 429);
    assert.equal(fetches, 2);
  });

  it('describes the person when Kontext refuses the reference photo', async () => {
    setReadingQuotaForTests(createMemoryQuota());
    setSpendRedisForTests(allowingSpend());
    process.env.TOGETHER_API_KEY = 'test-key';
    process.env.TAROT_DAILY_SPEND_CAP_CENTS = '200';

    const bodies: Array<{ url: string; body: Record<string, unknown> }> = [];
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>;
      bodies.push({ url, body });
      if (url.includes('/images/')) {
        if (body.image_url) {
          return new Response(
            JSON.stringify({
              error: { code: 'third_party_data_sharing_blocked', message: 'blocked' },
            }),
            { status: 403, headers: { 'content-type': 'application/json' } },
          );
        }
        return new Response(
          JSON.stringify({ data: [{ url: 'https://api.together.ai/card.png' }] }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'A person with short dark hair wearing a black coat.' } }],
          usage: { prompt_tokens: 120, completion_tokens: 18 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    const photo = `data:image/jpeg;base64,${'B'.repeat(120)}`;
    const response = await generateCard(
      request('203.0.113.61', 'reading-portrait', {
        cardName: 'The Lovers',
        deckStyle: 'classic',
        userPhotoBase64: photo,
      }),
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.imageUrl, 'https://api.together.ai/card.png');
    assert.equal(bodies.length, 3);
    assert.equal(bodies[0].body.model, 'black-forest-labs/FLUX.1-kontext-pro');
    assert.equal(bodies[0].body.image_url, photo);
    assert.equal(bodies[0].body.aspect_ratio, '2:3');
    assert.match(String(bodies[1].url), /chat\/completions/);
    assert.equal(bodies[2].body.image_url, undefined);
    assert.match(String(bodies[2].body.prompt), /short dark hair/);
    assert.match(String(bodies[2].body.prompt), /Neo-Grimoire/);
    assert.match(String(bodies[2].body.prompt), /long robes/);
    assert.doesNotMatch(JSON.stringify(payload), /data:image/);
  });

  it('retries one unsafe picture with a symbolic scene and a second image slot', async () => {
    const quota = createMemoryQuota();
    setReadingQuotaForTests(quota);
    setSpendRedisForTests(allowingSpend());
    process.env.TOGETHER_API_KEY = 'test-key';
    process.env.TAROT_DAILY_SPEND_CAP_CENTS = '200';

    const prompts: string[] = [];
    globalThis.fetch = async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as { prompt?: string };
      prompts.push(body.prompt ?? '');
      if (prompts.length === 1) {
        return new Response(
          JSON.stringify({ error: { message: 'image may contain NSFW content' } }),
          { status: 422, headers: { 'content-type': 'application/json' } },
        );
      }
      return new Response(
        JSON.stringify({ data: [{ url: 'https://api.together.ai/sun.png' }] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    };

    const response = await generateCard(
      request('203.0.113.62', 'reading-nsfw', { cardName: 'The Sun', deckStyle: 'classic' }),
    );
    const payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.imageUrl, 'https://api.together.ai/sun.png');
    assert.equal(prompts.length, 2);
    assert.match(prompts[1], /Objects only/);
    assert.doesNotMatch(prompts[1], /white horse/);

    for (let i = 0; i < MAX_IMAGE_CALLS_PER_READING - 2; i += 1) {
      assert.equal((await quota.consume('203.0.113.62', 'reading-nsfw', Date.now(), 'image')).ok, true);
    }
    const blocked = await quota.consume('203.0.113.62', 'reading-nsfw', Date.now(), 'image');
    assert.equal(blocked.ok, false);
  });

  it('does not draw again when the image cap is already spent on the unsafe retry', async () => {
    const quota = createMemoryQuota();
    const now = Date.now();
    for (let i = 0; i < MAX_IMAGE_CALLS_PER_READING - 1; i += 1) {
      assert.equal((await quota.consume('203.0.113.63', 'reading-last', now, 'image')).ok, true);
    }
    setReadingQuotaForTests(quota);
    setSpendRedisForTests(allowingSpend());
    process.env.TOGETHER_API_KEY = 'test-key';
    process.env.TAROT_DAILY_SPEND_CAP_CENTS = '200';

    let images = 0;
    globalThis.fetch = async () => {
      images += 1;
      return new Response(
        JSON.stringify({ error: { message: 'image may contain NSFW content' } }),
        { status: 422, headers: { 'content-type': 'application/json' } },
      );
    };

    const response = await generateCard(
      request('203.0.113.63', 'reading-last', { cardName: 'The Sun', deckStyle: 'classic' }),
    );
    assert.equal(response.status, 429);
    assert.equal(images, 1);
  });

  it('stops image generation when the daily cap is already spent', async () => {
    setReadingQuotaForTests(createMemoryQuota());
    setSpendRedisForTests(async () => [0, 2_000_000]);
    process.env.TOGETHER_API_KEY = 'test-key';
    process.env.TAROT_DAILY_SPEND_CAP_CENTS = '200';

    let fetches = 0;
    globalThis.fetch = async () => {
      fetches += 1;
      throw new Error('Together should not be called');
    };
    const photo = `data:image/jpeg;base64,${'B'.repeat(120)}`;
    const response = await generateCard(
      request('203.0.113.70', 'reading-capped', {
        cardName: 'The Fool',
        deckStyle: 'classic',
        userPhotoBase64: photo,
      }),
    );
    const text = await response.text();
    assert.equal(response.status, 429);
    assert.match(text, new RegExp(SPEND_CAP_MESSAGE));
    assert.doesNotMatch(text, /data:image/);
    assert.equal(fetches, 0);
  });

  it('blocks the paid call when the spend store throws', async () => {
    setReadingQuotaForTests(createMemoryQuota());
    setSpendRedisForTests(async () => {
      throw new Error('ECONNRESET');
    });
    process.env.TOGETHER_API_KEY = 'test-key';
    let fetches = 0;
    globalThis.fetch = async () => {
      fetches += 1;
      throw new Error('Together should not be called');
    };
    const response = await generateSynthesis(
      request('203.0.113.80', 'reading-outage', { cardReadings: [], spreadType: 'single' }),
    );
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error, 'limits_unavailable');
    assert.equal(fetches, 0);
  });

  it('does not keep the uploaded face photo', () => {
    const card = fs.readFileSync(new URL('../app/api/generate-card/route.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(card, /console\.\w+\([^)]*userPhotoBase64/);
    assert.doesNotMatch(card, /writeFile|localStorage/);
    const storage = fs.readFileSync(new URL('./storage.ts', import.meta.url), 'utf8');
    assert.doesNotMatch(storage, /userPhoto|photoBase64/);
    const page = fs.readFileSync(new URL('../app/reading/page.tsx', import.meta.url), 'utf8');
    const saved = page.slice(page.indexOf('const result: ReadingResult'), page.indexOf('saveReading(result)'));
    assert.doesNotMatch(saved, /userPhoto/);
    for (const file of [
      '../app/api/generate-card-reading/route.ts',
      '../app/api/generate-follow-ups/route.ts',
      '../app/api/generate-reading/route.ts',
      '../app/api/generate-synthesis/route.ts',
    ]) {
      const src = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
      assert.match(src, /readingLimitResponse\(/);
      assert.match(src, /paidChat\(/);
      assert.doesNotMatch(src, /api\.together\.xyz/);
    }
  });
});
