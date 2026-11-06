import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  MAX_PROXY_IMAGE_BYTES,
  allowedTogetherImageUrl,
  fetchProxiedImage,
  imageMediaType,
} from './proxy-image.ts';

const PNG = new Uint8Array([137, 80, 78, 71]);

function imageResponse(bytes: Uint8Array, headers: Record<string, string> = {}): Response {
  return new Response(bytes, {
    status: 200,
    headers: { 'content-type': 'image/png', ...headers },
  });
}

describe('together image url allowlist', () => {
  it('allows https Together image hosts and rejects everything else', () => {
    assert.equal(
      allowedTogetherImageUrl('https://api.together.ai/v1/images/abc')?.hostname,
      'api.together.ai',
    );
    assert.equal(allowedTogetherImageUrl('https://cdn.together.ai/card.jpg')?.hostname, 'cdn.together.ai');
    assert.equal(
      allowedTogetherImageUrl('https://images.togetherai.com/card.jpg')?.hostname,
      'images.togetherai.com',
    );
    assert.equal(allowedTogetherImageUrl('https://api.together.xyz/shrt/abc')?.hostname, 'api.together.xyz');
    assert.equal(allowedTogetherImageUrl('https://API.TOGETHER.AI./v1/images/a')?.hostname, 'api.together.ai');

    assert.equal(allowedTogetherImageUrl('http://api.together.ai/v1/images/a'), null);
    assert.equal(allowedTogetherImageUrl('https://api.together.ai:444/a'), null);
    assert.equal(allowedTogetherImageUrl('https://user:pass@api.together.ai/a'), null);
    assert.equal(allowedTogetherImageUrl('https://api.together.ai@evil.com/a'), null);
    assert.equal(allowedTogetherImageUrl('https://api.together.ai.evil.com/a'), null);
    assert.equal(allowedTogetherImageUrl('https://api.together.ai%2eevil.com/a'), null);
    assert.equal(allowedTogetherImageUrl('https://nottogether.ai/a'), null);
    assert.equal(allowedTogetherImageUrl('https://evil.com/a.png'), null);
    assert.equal(allowedTogetherImageUrl('https://127.0.0.1/a.png'), null);
    assert.equal(allowedTogetherImageUrl('http://169.254.169.254/latest'), null);
    assert.equal(allowedTogetherImageUrl('file:///etc/passwd'), null);
    assert.equal(allowedTogetherImageUrl('not a url'), null);
  });

  it('accepts only image media types', () => {
    assert.equal(imageMediaType('image/jpeg'), 'image/jpeg');
    assert.equal(imageMediaType('image/png; charset=binary'), 'image/png');
    assert.equal(imageMediaType('IMAGE/WEBP'), 'image/webp');
    assert.equal(imageMediaType('text/html'), null);
    assert.equal(imageMediaType('application/octet-stream'), null);
    assert.equal(imageMediaType(null), null);
  });
});

describe('fetchProxiedImage', () => {
  it('returns an image from an allowed host', async () => {
    const seen: string[] = [];
    const result = await fetchProxiedImage('https://api.together.ai/v1/images/abc', async (input, init) => {
      seen.push(String(input));
      assert.equal(init?.redirect, 'manual');
      return imageResponse(PNG);
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.contentType, 'image/png');
      assert.deepEqual(result.bytes, PNG);
    }
    assert.deepEqual(seen, ['https://api.together.ai/v1/images/abc']);
  });

  it('does not fetch a disallowed url', async () => {
    let called = false;
    const result = await fetchProxiedImage('http://127.0.0.1/latest/meta-data', async () => {
      called = true;
      return imageResponse(PNG);
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, 'rejected');
    assert.equal(called, false);
  });

  it('refuses a redirect off the Together image hosts', async () => {
    const seen: string[] = [];
    const result = await fetchProxiedImage('https://api.together.ai/v1/images/abc', async (input) => {
      seen.push(String(input));
      return new Response(null, {
        status: 302,
        headers: { location: 'https://169.254.169.254/latest/meta-data' },
      });
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, 'redirect');
    assert.deepEqual(seen, ['https://api.together.ai/v1/images/abc']);
  });

  it('follows a redirect that stays on an allowed host', async () => {
    const seen: string[] = [];
    const result = await fetchProxiedImage('https://api.together.ai/v1/images/abc', async (input) => {
      const url = String(input);
      seen.push(url);
      if (url.includes('/v1/images/abc')) {
        return new Response(null, {
          status: 302,
          headers: { location: 'https://cdn.together.ai/card.png' },
        });
      }
      return imageResponse(PNG, { 'content-type': 'image/jpeg' });
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.contentType, 'image/jpeg');
    assert.deepEqual(seen, [
      'https://api.together.ai/v1/images/abc',
      'https://cdn.together.ai/card.png',
    ]);
  });

  it('rejects non-image responses and bodies over 5MB', async () => {
    const html = await fetchProxiedImage('https://cdn.together.ai/x', async () => {
      return new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } });
    });
    assert.equal(html.ok, false);
    if (!html.ok) assert.equal(html.error, 'type');

    const declared = await fetchProxiedImage('https://cdn.together.ai/x', async () => {
      return imageResponse(PNG, { 'content-length': String(MAX_PROXY_IMAGE_BYTES + 1) });
    });
    assert.equal(declared.ok, false);
    if (!declared.ok) assert.equal(declared.error, 'size');

    const streamed = await fetchProxiedImage('https://cdn.together.ai/x', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(MAX_PROXY_IMAGE_BYTES));
          controller.enqueue(new Uint8Array(1));
          controller.close();
        },
      });
      return new Response(stream, { status: 200, headers: { 'content-type': 'image/png' } });
    });
    assert.equal(streamed.ok, false);
    if (!streamed.ok) assert.equal(streamed.error, 'size');
  });

  it('rejects an upstream error instead of proxying it', async () => {
    const result = await fetchProxiedImage('https://api.together.xyz/missing', async () => {
      return new Response('nope', { status: 502, headers: { 'content-type': 'text/plain' } });
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, 'upstream');
  });
});
