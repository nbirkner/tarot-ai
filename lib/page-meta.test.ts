import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OG_IMAGE, canonicalUrl, pageMetadata } from './page-meta.ts';

describe('page metadata', () => {
  it('points every page at the www.nikibirkner.com/tarot-ai address', () => {
    assert.equal(canonicalUrl('/'), 'https://www.nikibirkner.com/tarot-ai');
    assert.equal(canonicalUrl('/about'), 'https://www.nikibirkner.com/tarot-ai/about');
  });

  it('keeps the share image when a page overrides openGraph and twitter', () => {
    const meta = pageMetadata({ title: 'About', description: 'd', path: '/about' });
    assert.deepEqual(meta.openGraph?.images, [OG_IMAGE]);
    assert.deepEqual(meta.twitter?.images, [OG_IMAGE.url]);
    assert.equal(meta.openGraph?.title, 'About · Tarot AI');
    assert.equal(meta.robots, undefined);
  });

  it('marks a device-only page noindex', () => {
    const meta = pageMetadata({ title: 'Reading History', description: 'd', path: '/history', index: false });
    assert.deepEqual(meta.robots, { index: false, follow: true });
  });
});
