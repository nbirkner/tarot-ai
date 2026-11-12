'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SpreadSelector } from '../../components/SpreadSelector';
import { DeckSelector } from '../../components/DeckSelector';
import { AstrologyInput } from '../../components/AstrologyInput';
import { QuestionInput } from '../../components/QuestionInput';
import { PhotoUpload } from '../../components/PhotoUpload';
import { ContextInput } from '../../components/ContextInput';
import { TarotCard } from '../../components/TarotCard';
import { ReadingDisplay } from '../../components/ReadingDisplay';
import { StreamingReadingDisplay, StreamingState } from '../../components/StreamingReadingDisplay';
import {
  SpreadType,
  DeckStyle,
  AstrologyInput as AstrologyInputType,
  DrawnCard,
  ReadingResult,
} from '../../lib/types';
import { drawCards, drawOshoZenCards, isReversed, getSpread } from '../../lib/tarot';
import { buildReadingContext, formatAstrologyContext } from '../../lib/astronomy';
import { apiUrl } from '../../lib/base-path';
import {
  RATE_LIMIT_MESSAGE,
  SPEND_CAP_MESSAGE,
  messageForLimitResponse,
} from '../../lib/rate-limit-shared';
import { PROVIDER_BLOCKED_MESSAGE } from '../../lib/together';
import { getUserId, saveReading } from '../../lib/storage';

type Step = 'question' | 'context' | 'spread' | 'deck' | 'photo' | 'astrology' | 'generating' | 'reveal' | 'reading';

const STEP_CONFIG: Record<
  Exclude<Step, 'generating' | 'reveal' | 'reading'>,
  { title: string; subtitle?: string }
> = {
  question: {
    title: 'What calls for clarity?',
    subtitle: 'Ask a question, or let the cards speak freely.',
  },
  context: {
    title: 'Add context',
    subtitle: 'Optional. The more you share, the nosier the oracle gets.',
  },
  spread: {
    title: 'Choose your spread',
    subtitle: 'More cards, more unsolicited advice from the universe.',
  },
  deck: {
    title: 'Choose your deck',
    subtitle: 'Each style conjures a different energy.',
  },
  photo: {
    title: 'Add your photo',
    subtitle: 'Optional. So you can see your face in The Tower.',
  },
  astrology: {
    title: 'Your astrological self',
    subtitle: 'Optional. Useful for blaming Mercury when the reading is accurate.',
  },
};

const SETUP_STEPS: Array<Exclude<Step, 'generating' | 'reveal' | 'reading'>> = [
  'question',
  'context',
  'deck',
  'spread',
  'photo',
  'astrology',
];

function unescapeJson(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function cleanJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

class RateLimitError extends Error {
  constructor(message = RATE_LIMIT_MESSAGE) {
    super(message);
    this.name = 'RateLimitError';
  }
}

function isRateLimit(err: unknown): err is RateLimitError {
  return err instanceof Error && err.name === 'RateLimitError';
}

function isPermanentProviderError(err: unknown): err is Error {
  return err instanceof Error && err.name === 'PermanentHttpError';
}

async function permanentProviderError(res: Response): Promise<Error> {
  let message = PROVIDER_BLOCKED_MESSAGE;
  const text = await res.text().catch(() => '');
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (typeof parsed.error === 'string' && parsed.error.trim()) message = parsed.error;
  } catch {
    // Keep the friendly sentence when the body is not JSON.
  }
  const err = new Error(message);
  err.name = 'PermanentHttpError';
  return err;
}

async function throwIfRateLimited(res: Response) {
  if (res.status !== 429 && res.status !== 503) return;
  const text = await res.clone().text().catch(() => '');
  const message = messageForLimitResponse(res.status, text);
  if (message) throw new RateLimitError(message);
}
// Returns results in the same order, matching Promise.allSettled semantics.
async function pooledAllSettled<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: 'fulfilled', value: await fn(items[i], i) };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// Retry a function up to maxAttempts times with a fixed delay between attempts.
async function withRetry<T>(fn: () => Promise<T>, maxAttempts: number, delayMs = 1500): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, delayMs));
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (isRateLimit(e) || (e instanceof Error && e.name === 'PermanentHttpError')) throw e;
    }
  }
  throw lastError;
}

// Wrap a promise with a timeout. Rejects with a TimeoutError after ms milliseconds.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} exceeded ${ms}ms`)), ms)
    ),
  ]);
}

// Read a Together AI SSE stream to completion, calling onPartial on each partial accumulation.
// Per-read timeout prevents a stalled stream from blocking forever.
async function readSseStream(
  res: Response,
  onPartial: (accumulated: string) => void,
  onBytes?: () => void,
): Promise<string> {
  if (!res.body) {
    throw new Error('Response body is null. Cannot read the stream.');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '';
  let accumulated = '';
  // 20s per individual read — if a chunk doesn't arrive in 20s the stream is stuck
  const READ_TIMEOUT_MS = 20000;
  try {
    outer: while (true) {
      const { done, value } = await withTimeout(
        reader.read(),
        READ_TIMEOUT_MS,
        'SSE chunk read',
      );
      if (done) break;
      if (value.byteLength > 0) onBytes?.();
      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break outer;
        try {
          const event = JSON.parse(data);
          const token: string = event.choices?.[0]?.delta?.content ?? '';
          if (token) {
            accumulated += token;
            onPartial(accumulated);
          }
        } catch {}
      }
    }
  } finally {
    try { reader.releaseLock(); } catch {}
  }
  return cleanJson(accumulated);
}

// Extract interpretation + keywords from a partial single-card JSON buffer
function extractCardFields(buf: string): Partial<{ keywords: string[]; interpretation: string; interpretationDone: boolean }> {
  const u: Partial<{ keywords: string[]; interpretation: string; interpretationDone: boolean }> = {};
  const interp = buf.match(/"interpretation"\s*:\s*"((?:[^"\\]|\\.)*)(")?/);
  if (interp?.[1] !== undefined) {
    u.interpretation = unescapeJson(interp[1]);
    u.interpretationDone = interp[2] === '"';
  }
  const kw = buf.match(/"keywords"\s*:\s*(\[[^\]]*\])/);
  if (kw?.[1]) { try { u.keywords = JSON.parse(kw[1]); } catch {} }
  return u;
}

// Extract synthesis fields from a partial synthesis JSON buffer
function extractSynthesisFields(buf: string): Partial<StreamingState> {
  const u: Partial<StreamingState> = {};
  const oe = buf.match(/"overallEnergy"\s*:\s*"((?:[^"\\]|\\.)*)(")?/);
  if (oe?.[1] !== undefined) { u.overallEnergy = unescapeJson(oe[1]); u.overallEnergyDone = oe[2] === '"'; }
  const syn = buf.match(/"synthesis"\s*:\s*"((?:[^"\\]|\\.)*)(")?/);
  if (syn?.[1] !== undefined) { u.synthesis = unescapeJson(syn[1]); u.synthesisDone = syn[2] === '"'; }
  const aff = buf.match(/"affirmation"\s*:\s*"((?:[^"\\]|\\.)*)"(?=\s*[,}\n])/);
  if (aff) u.affirmation = unescapeJson(aff[1]);
  const timing = buf.match(/"notableTiming"\s*:\s*"((?:[^"\\]|\\.)*)"(?=\s*[,}\n])/);
  if (timing) u.notableTiming = unescapeJson(timing[1]);
  return u;
}


export default function ReadingPage() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [spreadType, setSpreadType] = useState<SpreadType>('three');
  const [deckStyle, setDeckStyle] = useState<DeckStyle>('dark-gothic');

  const isOshoZen = deckStyle === 'osho-zen';

  function handleDeckChange(style: DeckStyle) {
    setDeckStyle(style);
    const toOsho = style === 'osho-zen';
    const fromOsho = deckStyle === 'osho-zen';
    const currentIsOshoSpread = spreadType.startsWith('osho-');
    if (toOsho && !currentIsOshoSpread) setSpreadType('osho-three');
    if (!toOsho && currentIsOshoSpread) setSpreadType('three');
  }
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [astrology, setAstrology] = useState<AstrologyInputType>({ type: 'none' });
  const [userContext, setUserContext] = useState('');
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [isReadingReady, setIsReadingReady] = useState(false);
  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const resolvedImagesRef = useRef<(string | undefined)[]>([]);
  const hangTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allFlipped = drawnCards.length > 0 && flippedCards.size === drawnCards.length;

  function flipCard(index: number) {
    if (!isReadingReady) return;
    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }

  function flipAll() {
    if (!isReadingReady) return;
    setFlippedCards(new Set(drawnCards.map((_, i) => i)));
  }

  async function startReading() {
    setStep('generating');
    setError(null);
    setIsReadingReady(false);
    setFlippedCards(new Set());
    setStreamingState(null);

    // 45s with no bytes from a card-reading stream means the oracle is stuck.
    // Any SSE bytes restart that clock, including frames with no delta.content.
    const resetHangTimer = () => {
      if (hangTimerRef.current) clearTimeout(hangTimerRef.current);
      hangTimerRef.current = setTimeout(() => {
        hangTimerRef.current = null;
        setStreamingState(null);
        setError('hang');
      }, 45000);
    };
    resetHangTimer();

    const readingId = crypto.randomUUID();
    const apiHeaders = {
      'Content-Type': 'application/json',
      'x-reading-id': readingId,
    };

    const spread = getSpread(spreadType);
    const cards = isOshoZen ? drawOshoZenCards(spread.cardCount) : drawCards(spread.cardCount);
    const now = new Date();
    const userId = getUserId();
    const dateStr = now.toISOString().split('T')[0];

    const initialDrawn: DrawnCard[] = cards.map((card, i) => ({
      card,
      position: spread.positions[i],
      reversed: isOshoZen ? false : isReversed(),
    }));
    setDrawnCards(initialDrawn);
    resolvedImagesRef.current = new Array(initialDrawn.length).fill(undefined);

    // Show skeleton layout immediately — don't wait for streaming to start
    setStreamingState({
      overallEnergy: '',
      overallEnergyDone: false,
      cards: Array.from({ length: initialDrawn.length }, () => ({
        keywords: [],
        interpretation: '',
        interpretationDone: false,
      })),
      synthesis: '',
      synthesisDone: false,
      affirmation: '',
      notableTiming: '',
    });

    // Fire image generation with a concurrency cap of 3.
    // One retry. 45s covers Kontext plus a vision description, and stays
    // inside the route's 60s limit. A finished picture is cached for this
    // reading, so the retry does not draw it again.
    // On final failure, marks imageUrl as 'failed' so card shows a fallback.
    const IMAGE_TIMEOUT_MS = 45000;
    void pooledAllSettled(initialDrawn, 3, async (drawn, i) => {
      try {
        const body = JSON.stringify({
          cardName: drawn.card.name,
          deckStyle,
          userId,
          date: dateStr,
          ...(userPhoto ? { userPhotoBase64: userPhoto } : {}),
        });

        const data = await withRetry(async () => {
          const res = await withTimeout(
            fetch(apiUrl('/api/generate-card'), {
              method: 'POST',
              headers: apiHeaders,
              body,
            }),
            IMAGE_TIMEOUT_MS,
            `image gen ${i}`,
          );
          await throwIfRateLimited(res);
          if (res.status === 403) throw await permanentProviderError(res);
          if (!res.ok) {
            const err = new Error(`HTTP ${res.status}`);
            if (res.status >= 400 && res.status < 500) err.name = 'PermanentHttpError';
            throw err;
          }
          const json = await res.json();
          if (!json.imageUrl) throw new Error('No imageUrl in response');
          return json;
        }, 2, 1500);

        resolvedImagesRef.current[i] = data.imageUrl;
        setDrawnCards((prev) =>
          prev.map((d, j) => (j === i ? { ...d, imageUrl: data.imageUrl } : d))
        );
      } catch (err) {
        console.error(`Image gen failed after retries for ${drawn.card.name}:`, err);
        if (isRateLimit(err)) setError(err.message);
        setDrawnCards((prev) =>
          prev.map((d, j) => (j === i ? { ...d, imageUrl: 'failed' } : d))
        );
      }
    });

    const context = buildReadingContext(now);
    const formattedAstrology = formatAstrologyContext(astrology, now);

    try {
      const controller = new AbortController();
      // Global budget: concurrency=3 means ceil(10/3)=4 rounds × ~20s + synthesis ~15s.
      setTimeout(() => controller.abort(), 120000);

      const sharedBody = {
        question,
        formattedAstrology,
        userContext: userContext || undefined,
        spreadPositions: spread.positions,
        deckStyle,
        ...context,
      };

      // Per-card timeout: one Muse call plus stream. Kept under the route's 45s
      // upstream abort so a stuck card cannot block the whole spread.
      const PER_CARD_TIMEOUT_MS = 40000;

      // Helper: fetch one card reading with retry on any failure (up to 2 attempts,
      // 2s back-off between), plus a hard per-card timeout.
      async function fetchCardReading(drawn: DrawnCard, i: number) {
        const body = JSON.stringify({
          ...sharedBody,
          card: drawn.card.name,
          position: drawn.position,
          reversed: drawn.reversed,
          otherCards: initialDrawn
            .filter((_, j) => j !== i)
            .map(d => `${d.card.name} (${d.position})`),
        });

        return withRetry(async () => {
          const res = await withTimeout(
            fetch(apiUrl('/api/generate-card-reading'), {
              method: 'POST',
              headers: apiHeaders,
              signal: controller.signal,
              body,
            }),
            PER_CARD_TIMEOUT_MS,
            `card ${i} fetch`,
          );

          await throwIfRateLimited(res);
          if (res.status === 403) throw await permanentProviderError(res);
          if (!res.ok) {
            const errText = await res.text().catch(() => '');
            console.error(`Card ${i} API error:`, res.status, errText);
            throw new Error(`Card reading failed (${res.status})`);
          }

          const json = await withTimeout(
            readSseStream(
              res,
              (partial) => {
                const fields = extractCardFields(partial);
                if (Object.keys(fields).length > 0) {
                  setStreamingState(prev => {
                    if (!prev) return prev;
                    const cards = [...prev.cards];
                    cards[i] = { ...cards[i], ...fields };
                    return { ...prev, cards };
                  });
                }
              },
              resetHangTimer,
            ),
            PER_CARD_TIMEOUT_MS,
            `card ${i} stream`,
          );

          const parsed = JSON.parse(json);
          return {
            card: drawn.card.name,
            position: drawn.position,
            reversed: drawn.reversed,
            keywords: parsed.keywords ?? [],
            interpretation: parsed.interpretation ?? '',
          };
        }, 2, 2000);
      }

        // ── Fire card reading calls with concurrency cap ───────
      // Max 3 in-flight at once to avoid Together AI rate limits.
      // Larger spreads (5, 10) queue naturally as slots free up.
      const cardResults = await pooledAllSettled(initialDrawn, 3, fetchCardReading);

      // Build the list of successful card readings. For failed cards, show a fallback
      // in the streaming state and pass a placeholder to synthesis.
      const cardReadings: Array<{
        card: string;
        position: string;
        reversed: boolean;
        keywords: string[];
        interpretation: string;
      }> = cardResults.map((result, i) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        // Failed card — log and set a fallback in the streaming UI
        console.error(`Card ${i} failed:`, result.reason);
        setStreamingState(prev => {
          if (!prev) return prev;
          const cards = [...prev.cards];
          cards[i] = {
            ...cards[i],
            interpretation: '[Reading unavailable for this card]',
            interpretationDone: true,
            keywords: [],
          };
          return { ...prev, cards };
        });
        return {
          card: initialDrawn[i].card.name,
          position: initialDrawn[i].position,
          reversed: initialDrawn[i].reversed,
          keywords: [],
          interpretation: '[Reading unavailable for this card]',
        };
      });

      // If every single card failed, abort — there's nothing to synthesize.
      const successCount = cardResults.filter(r => r.status === 'fulfilled').length;
      if (cardResults.some(r => r.status === 'rejected' && isRateLimit(r.reason))) {
        if (hangTimerRef.current) { clearTimeout(hangTimerRef.current); hangTimerRef.current = null; }
        setStreamingState(null);
        const limited = cardResults.find(
          (result): result is PromiseRejectedResult => result.status === 'rejected' && isRateLimit(result.reason),
        );
        setError(limited && isRateLimit(limited.reason) ? limited.reason.message : RATE_LIMIT_MESSAGE);
        return;
      }
      const blocked = cardResults.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected' && isPermanentProviderError(result.reason),
      );
      if (blocked && successCount === 0) {
        if (hangTimerRef.current) { clearTimeout(hangTimerRef.current); hangTimerRef.current = null; }
        setStreamingState(null);
        setError(blocked.reason.message);
        return;
      }
      if (successCount === 0) {
        setStreamingState(null);
        setError('The oracle could not read any of your cards. Please try again.');
        return;
      }

      // ── Fire synthesis call (with whatever cards succeeded) ────────────────────────────────
      // Retry once after 2s on any failure (network blip, 5xx, etc.)
      const SYNTH_TIMEOUT_MS = 45000;
      let synthJson = '';
      try {
        synthJson = await withRetry(async () => {
          const synthRes = await withTimeout(
            fetch(apiUrl('/api/generate-synthesis'), {
              method: 'POST',
              headers: apiHeaders,
              signal: controller.signal,
              body: JSON.stringify({
                ...sharedBody,
                spreadType,
                cardReadings,
              }),
            }),
            SYNTH_TIMEOUT_MS,
            'synthesis fetch',
          );

          await throwIfRateLimited(synthRes);
          if (synthRes.status === 403) throw await permanentProviderError(synthRes);
          if (!synthRes.ok) {
            const errText = await synthRes.text().catch(() => '');
            console.error('Synthesis API error:', synthRes.status, errText);
            throw new Error(`Synthesis failed (${synthRes.status})`);
          }

          return withTimeout(
            readSseStream(synthRes, (partial) => {
              const fields = extractSynthesisFields(partial);
              if (Object.keys(fields).length > 0) {
                setStreamingState(prev => prev ? { ...prev, ...fields } : prev);
              }
            }),
            SYNTH_TIMEOUT_MS,
            'synthesis stream',
          );
        }, 2, 2000);
      } catch (synthErr) {
        console.error('Synthesis failed after retries:', synthErr);
        if (hangTimerRef.current) { clearTimeout(hangTimerRef.current); hangTimerRef.current = null; }
        setStreamingState(null);
        setError(
          isRateLimit(synthErr) || isPermanentProviderError(synthErr)
            ? synthErr.message
            : 'The oracle fell silent during synthesis. Please try again.',
        );
        return;
      }

      const synthData = JSON.parse(synthJson);

      const result: ReadingResult = {
        id: crypto.randomUUID(),
        date: now.toISOString(),
        question,
        spreadType,
        deckStyle,
        cards: initialDrawn.map((d, i) => ({ ...d, imageUrl: resolvedImagesRef.current[i] })),
        overallEnergy: synthData.overallEnergy ?? '',
        cardReadings: cardReadings.map(cr => ({
          card: cr.card,
          position: cr.position,
          keywords: cr.keywords,
          interpretation: cr.interpretation,
        })),
        synthesis: synthData.synthesis ?? '',
        affirmation: synthData.affirmation ?? '',
        notableTiming: synthData.notableTiming ?? '',
      };

      saveReading(result);
      setReading(result);
      setIsReadingReady(true);
    } catch (err) {
      console.error('Reading error:', err);
      if (hangTimerRef.current) { clearTimeout(hangTimerRef.current); hangTimerRef.current = null; }
      setStreamingState(null);
      if (isRateLimit(err)) {
        setError(err.message);
      } else if (err instanceof Error && err.name === 'AbortError') {
        setError('The oracle is taking too long to respond. Please try again.');
      } else {
        setError(`Reading failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  function reset() {
    setStep('question');
    setQuestion('');
    setUserContext('');
    setUserPhoto(null);
    setDrawnCards([]);
    setFlippedCards(new Set());
    setIsReadingReady(false);
    setReading(null);
    setError(null);
    setStreamingState(null);
  }

  // Determine card size based on count
  const cardSize =
    drawnCards.length === 1
      ? 'hero'
      : drawnCards.length <= 3
      ? 'lg'
      : drawnCards.length <= 5
      ? 'md'
      : 'sm';

  const isSetupStep = SETUP_STEPS.includes(step as (typeof SETUP_STEPS)[number]);

  // Advance setup flow on Enter key press
  useEffect(() => {
    if (!isSetupStep) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter') return;

      const active = document.activeElement;
      const isTextarea = active instanceof HTMLTextAreaElement;

      // Shift+Enter inside a textarea = newline, don't advance
      if (isTextarea && e.shiftKey) return;

      // Plain Enter (textarea or elsewhere) = advance
      e.preventDefault();
      const currentIndex = SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]);
      if (step === 'astrology') {
        startReading();
      } else {
        setStep(SETUP_STEPS[currentIndex + 1]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, isSetupStep]);

  return (
    <main className="reading">
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -10 }}
            transition={reduce ? { duration: 0 } : { duration: 0.3 }}
          >
            {isSetupStep && (
              <div className="reading-step">
                <div className="step-head">
                  <h1 className="step-title">
                    <span className="idx">
                      {String(SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]) + 1).padStart(2, '0')}
                      {' / '}
                    </span>
                    {STEP_CONFIG[step as keyof typeof STEP_CONFIG]?.title}
                  </h1>
                  {STEP_CONFIG[step as keyof typeof STEP_CONFIG]?.subtitle && (
                    <p className="lede">{STEP_CONFIG[step as keyof typeof STEP_CONFIG]?.subtitle}</p>
                  )}
                </div>

                <hr className="rule" />

                {step === 'question' && (
                  <QuestionInput
                    value={question}
                    onChange={setQuestion}
                    onSkip={() => setStep('context')}
                  />
                )}
                {step === 'context' && (
                  <ContextInput
                    question={question}
                    value={userContext}
                    onChange={setUserContext}
                  />
                )}
                {step === 'spread' && (
                  <SpreadSelector
                    value={spreadType}
                    onChange={setSpreadType}
                    deckType={isOshoZen ? 'osho-zen' : 'rider-waite'}
                  />
                )}
                {step === 'deck' && (
                  <DeckSelector value={deckStyle} onChange={handleDeckChange} />
                )}
                {step === 'photo' && (
                  <PhotoUpload value={userPhoto} onChange={setUserPhoto} />
                )}
                {step === 'astrology' && (
                  <AstrologyInput value={astrology} onChange={setAstrology} />
                )}

                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}

                <div className="step-nav">
                  {step !== 'question' ? (
                    <button
                      type="button"
                      onClick={() => {
                        const i = SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]);
                        if (i > 0) setStep(SETUP_STEPS[i - 1]);
                      }}
                      className="btn-secondary"
                    >
                      Back
                    </button>
                  ) : (
                    <span />
                  )}

                  {step === 'astrology' ? (
                    <button type="button" onClick={startReading} className="btn-primary">
                      Draw the Cards
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const i = SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]);
                        setStep(SETUP_STEPS[i + 1]);
                      }}
                      className="btn-primary"
                    >
                      Continue
                    </button>
                  )}
                </div>

                <div className="step-meter" aria-hidden="true">
                  {SETUP_STEPS.map((s, idx) => {
                    const currentIdx = SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]);
                    const isOn = idx <= currentIdx;
                    return <i key={s} className={isOn ? 'is-on' : undefined} />;
                  })}
                </div>
              </div>
            )}

            {/* Generating + Reveal state — dark atmosphere */}
            {(step === 'generating' || isReadingReady) && (
              <div className="reading-step" style={{ maxWidth: '100%' }}>
                <div className="tool-row">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setStep('astrology');
                      setDrawnCards([]);
                      setFlippedCards(new Set());
                      setStreamingState(null);
                      setReading(null);
                      setError(null);
                    }}
                  >
                    Back
                  </button>

                  {/* Download buttons — top right, only when reading is ready */}
                  {isReadingReady && reading && (() => {
                    const allImagesLoaded = drawnCards.length > 0 && drawnCards.every(d => d.imageUrl);
                    const readingWithImages = { ...reading, cards: drawnCards };
                    const canDownload = allImagesLoaded && !isPdfGenerating;
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={!canDownload}
                          onClick={async () => {
                            setIsPdfGenerating(true);
                            try {
                              const { downloadReadingPDF } = await import('../../lib/pdf');
                              await downloadReadingPDF(readingWithImages);
                            } catch (e) {
                              console.error('PDF generation failed:', e);
                              setPdfError(e instanceof Error ? e.message : String(e));
                            } finally {
                              setIsPdfGenerating(false);
                            }
                          }}
                        >
                          {isPdfGenerating ? 'Preparing' : 'Download Reading'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={!canDownload}
                          onClick={async () => {
                            setIsPdfGenerating(true);
                            try {
                              const { downloadCardsPDF } = await import('../../lib/pdf');
                              await downloadCardsPDF(readingWithImages);
                            } catch (e) {
                              console.error('PDF generation failed:', e);
                              setPdfError(e instanceof Error ? e.message : String(e));
                            } finally {
                              setIsPdfGenerating(false);
                            }
                          }}
                        >
                          {isPdfGenerating ? 'Preparing' : 'Download Cards'}
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Page title */}
                <div className="reveal-head">
                  {question && <p className="question-line">&ldquo;{question}&rdquo;</p>}
                  {!isReadingReady && !error && <h1 className="step-title">Drawing</h1>}
                  {isReadingReady && (
                    <>
                      <h1 className="seal">
                        Your fate is sealed. <em>Turn each card over.</em>
                      </h1>
                      {!allFlipped && (
                        <button type="button" onClick={flipAll} className="btn-secondary">
                          Turn All Over
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="spread-row">
                  {drawnCards.map((drawn, i) => (
                    <TarotCard
                      key={`${drawn.card.name}-${i}`}
                      drawn={drawn}
                      isFlipped={flippedCards.has(i)}
                      isFlippable={isReadingReady && !flippedCards.has(i)}
                      onClick={() => flipCard(i)}
                      size={cardSize}
                      showPosition={true}
                      tilt={(i % 5 - 2) * 2.4}
                    />
                  ))}
                </div>

                {/* Ornamental divider — appears as soon as cards are drawn */}
                {drawnCards.length > 0 && <hr className="rule" />}

                {pdfError && (
                  <div className="limit-panel" role="alert">
                    <h2 className="limit-title">The PDF did not land.</h2>
                    <p>{pdfError}</p>
                    <button type="button" className="btn-primary" onClick={() => setPdfError(null)}>
                      Back
                    </button>
                  </div>
                )}

                {error && !isReadingReady && (
                  <div className="limit-panel" role="alert">
                    <h1 className="limit-title">
                      {error === 'hang' ? 'The crystal ball is buffering.' : error}
                    </h1>
                    {error === 'hang' && (
                      <p>
                        Perhaps Mercury is in retrograde. The spirits will realign. Try summoning them again.
                      </p>
                    )}
                    {error === RATE_LIMIT_MESSAGE || error === SPEND_CAP_MESSAGE ? (
                      <button type="button" onClick={reset} className="btn-primary">
                        Back
                      </button>
                    ) : (
                      <button type="button" onClick={startReading} className="btn-primary">
                        Try Again
                      </button>
                    )}
                  </div>
                )}

                {streamingState && !isReadingReady && (
                  <StreamingReadingDisplay state={streamingState} drawnCards={drawnCards} />
                )}

                {/* Complete: full reading with motion reveals */}
                {isReadingReady && reading && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={reduce ? { duration: 0 } : { duration: 0.5 }}
                  >
                    <ReadingDisplay reading={reading} />
                    <div style={{ marginTop: 28 }}>
                      <button type="button" onClick={reset} className="btn-secondary">
                        Begin a New Reading
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
