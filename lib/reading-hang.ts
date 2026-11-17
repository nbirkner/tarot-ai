/** Silence after response headers, or between SSE chunks, means the stream stalled. */
export const READING_HANG_MS = 45_000;

export type HangWatch = {
  /** A reading or synthesis response has headers and a body to read. */
  headers: () => void;
  /** An SSE chunk arrived on an armed stream. */
  bytes: () => void;
  /** That stream finished or failed. */
  done: () => void;
  /** New reading, Try Again, or leaving the draw. */
  reset: () => void;
};

export function createHangWatch(onHang: () => void, timeoutMs = READING_HANG_MS): HangWatch {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let open = 0;
  let token = 0;

  function clear() {
    token += 1;
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  function arm() {
    clear();
    const scheduled = token;
    timer = setTimeout(() => {
      if (scheduled !== token) return;
      timer = null;
      onHang();
    }, timeoutMs);
  }

  return {
    headers() {
      open += 1;
      arm();
    },
    bytes() {
      if (open > 0) arm();
    },
    done() {
      open = Math.max(0, open - 1);
      if (open === 0) clear();
    },
    reset() {
      open = 0;
      clear();
    },
  };
}
