import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createHangWatch } from './reading-hang.ts';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('reading hang watch', () => {
  it('does not hang before response headers, including on stray bytes', async () => {
    let hangs = 0;
    const watch = createHangWatch(() => {
      hangs += 1;
    }, 40);
    watch.bytes();
    await delay(70);
    assert.equal(hangs, 0);
    watch.reset();
  });

  it('hangs when a stream sends no chunks after headers', async () => {
    let hangs = 0;
    const watch = createHangWatch(() => {
      hangs += 1;
    }, 40);
    watch.headers();
    await delay(20);
    assert.equal(hangs, 0);
    await delay(50);
    assert.equal(hangs, 1);
    watch.reset();
  });

  it('resets the clock on every sse chunk', async () => {
    let hangs = 0;
    const watch = createHangWatch(() => {
      hangs += 1;
    }, 50);
    watch.headers();
    await delay(30);
    watch.bytes();
    await delay(30);
    assert.equal(hangs, 0);
    await delay(40);
    assert.equal(hangs, 1);
    watch.reset();
  });

  it('disarms when the stream finishes, and keeps siblings armed', async () => {
    let finished = 0;
    const quiet = createHangWatch(() => {
      finished += 1;
    }, 40);
    quiet.headers();
    quiet.done();
    await delay(70);
    assert.equal(finished, 0);

    let siblings = 0;
    const paired = createHangWatch(() => {
      siblings += 1;
    }, 40);
    paired.headers();
    paired.headers();
    paired.done();
    await delay(70);
    assert.equal(siblings, 1);
    paired.reset();
  });

  it('reset cancels a running clock', async () => {
    let hangs = 0;
    const watch = createHangWatch(() => {
      hangs += 1;
    }, 40);
    watch.headers();
    watch.reset();
    await delay(70);
    assert.equal(hangs, 0);
  });
});
