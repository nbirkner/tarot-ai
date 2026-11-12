import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { legacyHostRedirects, resolveLegacyHostRedirect, TAROTACLE_HOST } from './legacy-host.ts';

describe('tarotacle host redirect', () => {
  it('permanently sends only tarotacle.vercel.app to nikibirkner.com/tarot-ai', () => {
    const rules = legacyHostRedirects();
    const prefixed = rules.findIndex((rule) => rule.source === '/tarot-ai/:path*');
    const catchAll = rules.findIndex((rule) => rule.source === '/:path*');
    assert.ok(prefixed >= 0 && prefixed < catchAll);

    for (const rule of rules) {
      assert.equal(rule.permanent, true);
      assert.deepEqual(rule.has, [{ type: 'host', value: TAROTACLE_HOST }]);
      assert.match(rule.destination, /^https:\/\/www\.nikibirkner\.com\/tarot-ai/);
    }

    assert.equal(
      resolveLegacyHostRedirect('tarotacle.vercel.app', '/'),
      'https://www.nikibirkner.com/tarot-ai',
    );
    assert.equal(
      resolveLegacyHostRedirect('tarotacle.vercel.app', '/reading'),
      'https://www.nikibirkner.com/tarot-ai/reading',
    );
    assert.equal(
      resolveLegacyHostRedirect('TAROTACLE.VERCEL.APP:443', '/api/generate-card'),
      'https://www.nikibirkner.com/tarot-ai/api/generate-card',
    );
    assert.equal(
      resolveLegacyHostRedirect('tarotacle.vercel.app', '/tarot-ai'),
      'https://www.nikibirkner.com/tarot-ai',
    );
    assert.equal(
      resolveLegacyHostRedirect('tarotacle.vercel.app', '/tarot-ai/reading'),
      'https://www.nikibirkner.com/tarot-ai/reading',
    );

    assert.equal(resolveLegacyHostRedirect('www.nikibirkner.com', '/reading'), null);
    assert.equal(resolveLegacyHostRedirect('tarot-ai-rouge-ten.vercel.app', '/reading'), null);
    assert.equal(resolveLegacyHostRedirect('tarotacle.vercel.app.evil.com', '/'), null);
  });
});
