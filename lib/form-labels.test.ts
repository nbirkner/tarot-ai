import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = new URL('..', import.meta.url).pathname;

function tsxFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith('.tsx') ? [path] : [];
  });
}

// Arrow functions inside a tag would otherwise end the match at their `>`.
function openingTags(source: string, tag: string): string[] {
  return source.replaceAll('=>', '=').match(new RegExp(`<${tag}\\b[^>]*>`, 'g')) ?? [];
}

const files = [...tsxFiles('app'), ...tsxFiles('components')].map((path) => ({
  path,
  source: readFileSync(join(ROOT, path), 'utf8'),
}));

describe('form labels', () => {
  it('ties every label to a control', () => {
    for (const { path, source } of files) {
      for (const tag of openingTags(source, 'label')) {
        assert.match(tag, /htmlFor=/, `${path}: ${tag}`);
      }
    }
  });

  // A display:none file input is reached through its visible button, not a label.
  it('gives every visible input, textarea and select a name', () => {
    for (const { path, source } of files) {
      for (const name of ['input', 'textarea', 'select']) {
        for (const tag of openingTags(source, name)) {
          if (/display: 'none'/.test(tag)) continue;
          assert.match(tag, /\b(id|aria-label|aria-labelledby)=/, `${path}: ${tag}`);
        }
      }
    }
  });
});
