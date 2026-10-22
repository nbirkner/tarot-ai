import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BASE_PATH, basePathFromPathname, stripBasePath, withBasePath } from './base-path.ts';

describe('base path', () => {
  it('prefixes app and API paths only when mounted under /tarot-ai', () => {
    assert.equal(withBasePath('/api/generate-card', ''), '/api/generate-card');
    assert.equal(withBasePath('/reading', BASE_PATH), '/tarot-ai/reading');
    assert.equal(withBasePath('/tarot-ai/api/generate-card', BASE_PATH), '/tarot-ai/api/generate-card');
  });

  it('detects the mount from the browser pathname and strips it for nav matching', () => {
    assert.equal(basePathFromPathname('/reading'), '');
    assert.equal(basePathFromPathname('/tarot-ai'), BASE_PATH);
    assert.equal(basePathFromPathname('/tarot-ai/reading'), BASE_PATH);
    assert.equal(stripBasePath('/tarot-ai/reading'), '/reading');
    assert.equal(stripBasePath('/tarot-ai'), '/');
    assert.equal(stripBasePath('/history'), '/history');
  });
});
