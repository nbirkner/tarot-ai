'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { drawCards, isReversed, getSpread } from '../../lib/tarot';
import { buildReadingContext, formatAstrologyContext } from '../../lib/astronomy';
import { getUserId, saveReading } from '../../lib/storage';

type Step = 'question' | 'context' | 'spread' | 'deck' | 'photo' | 'astrology' | 'generating' | 'reveal' | 'reading';

const WITCHY_PHRASES = [
  'manifesting your destiny...',
  'ascending through the veil...',
  'turbochakraing your intentions...',
  'consulting the ancient ones...',
  'weaving the threads of fate...',
  'aligning the celestial frequencies...',
  'communing with the cosmos...',
  'reading the akashic records...',
  'decoding the lunar signals...',
  'channeling the oracle within...',
  'dissolving karmic blockages...',
  'attuning to your higher self...',
  'googling "what the moon wants"...',
  'asking the ancient ones to please hold...',
  'defragging the spirit realm...',
  'estimating your fate (margin of error: ±one lifetime)...',
  'checking if Mercury is up to something again...',
  'filing a cosmic ticket on your behalf...',
  'waiting for the universe to load...',
  "consulting the oracle (she's with another client)...",
];

function WitchyLoader() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % WITCHY_PHRASES.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-8">
      {/* Orbiting stars */}
      <div className="relative w-16 h-16 mx-auto mb-6">
        <div
          className="absolute inset-0 rounded-full border border-[rgba(196,146,42,0.3)]"
          style={{ animation: 'rotate-slow 8s linear infinite' }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[#C4922A] text-xs">
            ✦
          </div>
        </div>
        <div
          className="absolute inset-2 rounded-full border border-[rgba(196,146,42,0.2)]"
          style={{ animation: 'rotate-slow 5s linear infinite reverse' }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[#C4922A] text-xs opacity-60">✦</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[#C4922A] text-lg">☽</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {visible && (
          <motion.p
            key={phraseIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: 20,
              fontStyle: 'italic',
              color: '#E8C96A',
              letterSpacing: '0.02em',
            }}
          >
            {WITCHY_PHRASES[phraseIndex]}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

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
    subtitle: 'Optional — but the more you share, the nosier the oracle gets.',
  },
  spread: {
    title: 'Choose your spread',
    subtitle: 'More cards = more unsolicited advice from the universe.',
  },
  deck: {
    title: 'Choose your deck',
    subtitle: 'Each style conjures a different energy.',
  },
  photo: {
    title: 'Add your photo',
    subtitle: 'Optional — so you can see your face in The Tower card.',
  },
  astrology: {
    title: 'Your astrological self',
    subtitle: 'Optional — great for blaming Mercury when the reading is accurate.',
  },
};

const SETUP_STEPS: Array<Exclude<Step, 'generating' | 'reveal' | 'reading'>> = [
  'question',
  'context',
  'spread',
  'deck',
  'photo',
  'astrology',
];

function unescapeJson(s: string): string {
  return s.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function cleanJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

// Run `fn` over `items` with at most `concurrency` in-flight at once.
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
    try { return await fn(); } catch (e) { lastError = e; }
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
): Promise<string> {
  if (!res.body) {
    throw new Error('Response body is null — cannot read SSE stream');
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
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [spreadType, setSpreadType] = useState<SpreadType>('three');
  const [deckStyle, setDeckStyle] = useState<DeckStyle>('dark-gothic');
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

    // If nothing streams within 20s, the oracle is stuck — show a friendly error.
    // Cleared as soon as the first card chunk arrives.
    if (hangTimerRef.current) clearTimeout(hangTimerRef.current);
    hangTimerRef.current = setTimeout(() => {
      setStreamingState(null);
      setError('hang');
    }, 20000);

    const spread = getSpread(spreadType);
    const cards = drawCards(spread.cardCount);
    const now = new Date();
    const userId = getUserId();
    const dateStr = now.toISOString().split('T')[0];

    const initialDrawn: DrawnCard[] = cards.map((card, i) => ({
      card,
      position: spread.positions[i],
      reversed: isReversed(),
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
    // Retries up to 5 times (1.5s between attempts, 15s timeout per attempt).
    // On final failure, marks imageUrl as 'failed' so card shows a fallback.
    const IMAGE_TIMEOUT_MS = 15000;
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
            fetch('/api/generate-card', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
            }),
            IMAGE_TIMEOUT_MS,
            `image gen ${i}`,
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (!json.imageUrl) throw new Error('No imageUrl in response');
          return json;
        }, 5, 1500);

        resolvedImagesRef.current[i] = data.imageUrl;
        setDrawnCards((prev) =>
          prev.map((d, j) => (j === i ? { ...d, imageUrl: data.imageUrl } : d))
        );
      } catch (err) {
        console.error(`Image gen failed after retries for ${drawn.card.name}:`, err);
        setDrawnCards((prev) =>
          prev.map((d, j) => (j === i ? { ...d, imageUrl: 'failed' } : d))
        );
      }
    });

    const context = buildReadingContext(now);
    const formattedAstrology = formatAstrologyContext(astrology, now);

    try {
      const controller = new AbortController();
      // Global budget: concurrency=3 means ceil(10/3)=4 rounds × ~15s + synthesis ~10s ≈ 70s
      setTimeout(() => controller.abort(), 90000);

      const sharedBody = {
        question,
        formattedAstrology,
        userContext: userContext || undefined,
        spreadPositions: spread.positions,
        ...context,
      };

      // Per-card timeout: 22s is enough for one LLM call + stream; keeps one stuck card
      // from blocking all of Promise.allSettled forever.
      const PER_CARD_TIMEOUT_MS = 22000;

      // Helper: fetch one card reading with a 429-retry and a hard per-card timeout.
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

        const attemptFetch = async (): Promise<Response> => {
          const res = await fetch('/api/generate-card-reading', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body,
          });
          // Retry once on 429 (rate limit) after a 1s back-off
          if (res.status === 429) {
            await new Promise(r => setTimeout(r, 1000));
            return fetch('/api/generate-card-reading', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body,
            });
          }
          return res;
        };

        const res = await withTimeout(attemptFetch(), PER_CARD_TIMEOUT_MS, `card ${i} fetch`);

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.error(`Card ${i} API error:`, res.status, errText);
          throw new Error(`Card reading failed (${res.status})`);
        }

        const json = await withTimeout(
          readSseStream(res, (partial) => {
            // Clear hang timer the moment first streaming data arrives
            if (hangTimerRef.current) { clearTimeout(hangTimerRef.current); hangTimerRef.current = null; }
            const fields = extractCardFields(partial);
            if (Object.keys(fields).length > 0) {
              setStreamingState(prev => {
                if (!prev) return prev;
                const cards = [...prev.cards];
                cards[i] = { ...cards[i], ...fields };
                return { ...prev, cards };
              });
            }
          }),
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
      if (successCount === 0) {
        setStreamingState(null);
        setError('The oracle could not read any of your cards. Please try again.');
        return;
      }

      // ── Fire synthesis call (with whatever cards succeeded) ────────────────────────────────
      const synthRes = await fetch('/api/generate-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          ...sharedBody,
          spreadType,
          cardReadings,
        }),
      });

      if (!synthRes.ok) {
        const errText = await synthRes.text().catch(() => '');
        console.error('Synthesis API error:', synthRes.status, errText);
        setStreamingState(null);
        setError(`The oracle fell silent (${synthRes.status}). Please try again.`);
        return;
      }

      const synthJson = await readSseStream(synthRes, (partial) => {
        const fields = extractSynthesisFields(partial);
        if (Object.keys(fields).length > 0) {
          setStreamingState(prev => prev ? { ...prev, ...fields } : prev);
        }
      });

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
      setStreamingState(null);
      if (err instanceof Error && err.name === 'AbortError') {
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
  const isDark = false; // always light background — sections have their own styling

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

  // Background styles
  const lightBg = 'var(--cream)';
  const darkBg =
    'radial-gradient(ellipse at 50% 0%, #0D1535 0%, #060C22 60%, #030710 100%)';
  const candleGlow =
    'radial-gradient(ellipse at 50% 80%, rgba(120,100,200,0.12) 0%, transparent 60%)';

  return (
    <main
      className="min-h-screen pt-20 pb-20 relative"
      style={{
        background: isDark ? `${candleGlow}, ${darkBg}` : lightBg,
        transition: 'background 0.8s ease',
      }}
    >
      <div className="max-w-3xl mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Setup steps — unchanged */}
            {isSetupStep && (
              <div className="max-w-xl mx-auto space-y-8">
                {/* Step header */}
                <div className="text-center pt-6" style={{ paddingBottom: 4 }}>
                  <p style={{
                    fontFamily: 'Spectral, serif',
                    fontSize: 11,
                    letterSpacing: '0.28em',
                    color: 'var(--gold)',
                    textTransform: 'uppercase',
                    marginBottom: 10,
                    opacity: 0.7,
                  }}>
                    ✦ {SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]) + 1} of {SETUP_STEPS.length}
                  </p>
                  <h2
                    style={{
                      fontFamily: 'Cinzel, serif',
                      fontSize: 'clamp(18px, 3vw, 24px)',
                      color: 'var(--brown-dark)',
                      letterSpacing: '0.07em',
                      fontWeight: 400,
                      marginBottom: 8,
                    }}
                  >
                    {STEP_CONFIG[step as keyof typeof STEP_CONFIG]?.title}
                  </h2>
                  {STEP_CONFIG[step as keyof typeof STEP_CONFIG]?.subtitle && (
                    <p
                      style={{
                        fontFamily: 'Spectral, serif',
                        fontSize: 16,
                        color: 'var(--brown-light)',
                        fontStyle: 'italic',
                        lineHeight: 1.4,
                      }}
                    >
                      {STEP_CONFIG[step as keyof typeof STEP_CONFIG]?.subtitle}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px" style={{ background: 'var(--border-gold)' }} />
                  <span style={{ color: 'var(--gold)', fontSize: 12 }}>✦</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-gold)' }} />
                </div>

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
                  <SpreadSelector value={spreadType} onChange={setSpreadType} />
                )}
                {step === 'deck' && (
                  <DeckSelector value={deckStyle} onChange={setDeckStyle} />
                )}
                {step === 'photo' && (
                  <PhotoUpload value={userPhoto} onChange={setUserPhoto} />
                )}
                {step === 'astrology' && (
                  <AstrologyInput value={astrology} onChange={setAstrology} />
                )}

                {error && (
                  <p
                    style={{
                      color: 'var(--rose)',
                      fontFamily: 'Spectral, serif',
                      fontStyle: 'italic',
                      textAlign: 'center',
                    }}
                  >
                    {error}
                  </p>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  {step !== 'question' ? (
                    <button
                      onClick={() => {
                        const i = SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]);
                        if (i > 0) setStep(SETUP_STEPS[i - 1]);
                      }}
                      className="btn-secondary"
                      style={{ fontSize: 12, letterSpacing: '0.14em' }}
                    >
                      ← Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step === 'astrology' ? (
                    <button onClick={startReading} className="btn-primary" style={{ fontSize: 11, letterSpacing: '0.22em' }}>
                      Draw the Cards
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const i = SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]);
                        setStep(SETUP_STEPS[i + 1]);
                      }}
                      className="btn-primary"
                      style={{ fontSize: 11, letterSpacing: '0.22em' }}
                    >
                      Continue →
                    </button>
                  )}
                </div>

                {/* Step indicator — refined dots */}
                <div className="flex justify-center items-center gap-3 pt-2">
                  {SETUP_STEPS.map((s, idx) => {
                    const currentIdx = SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]);
                    const isPast = idx < currentIdx;
                    const isActive = s === step;
                    return (
                      <div
                        key={s}
                        style={{
                          width: isActive ? 18 : 5,
                          height: 5,
                          borderRadius: isActive ? 2 : '50%',
                          background: isActive ? 'var(--gold)' : isPast ? 'var(--gold-muted)' : 'var(--border-gold)',
                          transition: 'all 0.3s ease',
                          opacity: isPast ? 0.55 : 1,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Generating + Reveal state — dark atmosphere */}
            {(step === 'generating' || isReadingReady) && (
              <div className="space-y-10">
                {/* Top bar: Back on left, downloads on right */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setStep('astrology');
                      setDrawnCards([]);
                      setFlippedCards(new Set());
                      setStreamingState(null);
                      setReading(null);
                      setError(null);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(196,146,42,0.5)',
                      fontFamily: 'Cinzel, serif',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--gold)'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(196,146,42,0.5)'; }}
                  >
                    ← Back
                  </button>

                  {/* Download buttons — top right, only when reading is ready */}
                  {isReadingReady && reading && (() => {
                    const allImagesLoaded = drawnCards.length > 0 && drawnCards.every(d => d.imageUrl);
                    const readingWithImages = { ...reading, cards: drawnCards };
                    const canDownload = allImagesLoaded && !isPdfGenerating;
                    const topBtnStyle = (active: boolean): React.CSSProperties => ({
                      background: 'transparent',
                      color: active ? 'var(--gold)' : 'rgba(196,146,42,0.3)',
                      fontFamily: 'Cinzel, serif',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      padding: '6px 14px',
                      borderRadius: 2,
                      border: `1px solid ${active ? 'rgba(196,146,42,0.4)' : 'rgba(196,146,42,0.15)'}`,
                      cursor: active ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    });
                    return (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={!canDownload}
                          onClick={async () => {
                            setIsPdfGenerating(true);
                            try {
                              const { downloadReadingPDF } = await import('../../lib/pdf');
                              await downloadReadingPDF(readingWithImages);
                            } catch (e) {
                              console.error('PDF generation failed:', e);
                              alert(`PDF failed: ${e instanceof Error ? e.message : String(e)}`);
                            } finally {
                              setIsPdfGenerating(false);
                            }
                          }}
                          style={topBtnStyle(canDownload)}
                        >
                          {isPdfGenerating ? '⋯' : '↓ Reading'}
                        </button>
                        <button
                          disabled={!canDownload}
                          onClick={async () => {
                            setIsPdfGenerating(true);
                            try {
                              const { downloadCardsPDF } = await import('../../lib/pdf');
                              await downloadCardsPDF(readingWithImages);
                            } catch (e) {
                              console.error('PDF generation failed:', e);
                              alert(`PDF failed: ${e instanceof Error ? e.message : String(e)}`);
                            } finally {
                              setIsPdfGenerating(false);
                            }
                          }}
                          style={{
                            ...topBtnStyle(canDownload),
                            color: canDownload ? 'var(--brown-mid)' : 'rgba(122,92,69,0.3)',
                            border: `1px solid ${canDownload ? 'var(--border-brown)' : 'rgba(122,92,69,0.15)'}`,
                          }}
                        >
                          {isPdfGenerating ? '⋯' : '↓ Cards'}
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Page title */}
                <div className="text-center pt-4">
                  {question && (
                    <p
                      style={{
                        fontFamily: 'Spectral, serif',
                        fontSize: 18,
                        fontStyle: 'italic',
                        color: isDark ? 'var(--gold-muted)' : 'var(--brown-mid)',
                        marginBottom: 8,
                        transition: 'color 0.6s ease',
                      }}
                    >
                      &ldquo;{question}&rdquo;
                    </p>
                  )}
                  {isReadingReady && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <p style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: 14,
                        letterSpacing: '0.12em',
                        color: 'var(--gold)',
                      }}>
                        YOUR FATE IS SEALED — CLICK EACH TO UNSEAL IT
                      </p>
                      {!allFlipped && (
                        <button
                          onClick={flipAll}
                          style={{
                            background: 'transparent',
                            border: '1px solid rgba(196,146,42,0.35)',
                            color: 'var(--gold)',
                            fontFamily: 'Cinzel, serif',
                            fontSize: 10,
                            letterSpacing: '0.18em',
                            padding: '7px 20px',
                            borderRadius: 2,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(196,146,42,0.08)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,146,42,0.35)';
                          }}
                        >
                          Reveal All
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Cards spread */}
                <div
                  className={`flex flex-wrap gap-6 justify-center items-start ${
                    drawnCards.length === 1 ? 'py-4' : ''
                  }`}
                >
                  {drawnCards.map((drawn, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
                    >
                      <TarotCard
                        drawn={drawn}
                        isFlipped={flippedCards.has(i)}
                        isFlippable={isReadingReady && !flippedCards.has(i)}
                        onClick={() => flipCard(i)}
                        size={cardSize}
                        showPosition={true}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Ornamental divider — appears as soon as cards are drawn */}
                {drawnCards.length > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(196,146,42,0.3)' : 'var(--border-gold)' }} />
                    <span style={{ color: 'var(--gold)', fontSize: 14 }}>✦ ✦ ✦</span>
                    <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(196,146,42,0.3)' : 'var(--border-gold)' }} />
                  </div>
                )}

                {/* Error state */}
                {error && !isReadingReady && (
                  <div className="text-center py-10 space-y-4">
                    {error === 'hang' ? (
                      <>
                        <div style={{ fontSize: 32, opacity: 0.6, marginBottom: 4 }}>☽</div>
                        <p style={{
                          fontFamily: 'var(--font-cinzel), Cinzel, serif',
                          fontSize: 12,
                          letterSpacing: '0.2em',
                          color: 'var(--gold)',
                          textTransform: 'uppercase',
                          opacity: 0.8,
                        }}>
                          The Oracle is Unreachable
                        </p>
                        <p style={{
                          fontFamily: 'var(--font-spectral), Spectral, serif',
                          fontSize: 16,
                          fontStyle: 'italic',
                          color: 'var(--brown-light)',
                          maxWidth: 360,
                          margin: '0 auto',
                          lineHeight: 1.65,
                        }}>
                          The crystal ball is buffering... Perhaps Mercury is in retrograde. The spirits will realign — try summoning them again.
                        </p>
                      </>
                    ) : (
                      <p style={{ fontFamily: 'Spectral, serif', fontSize: 18, fontStyle: 'italic', color: 'var(--brown-light)' }}>
                        {error}
                      </p>
                    )}
                    <div style={{ marginTop: 28 }}>
                      <button onClick={startReading} className="btn-primary">Try Again</button>
                    </div>
                  </div>
                )}

                {/* Skeleton + streaming (shown immediately once cards are drawn, no WitchyLoader wait) */}
                {streamingState && !isReadingReady && (
                  <StreamingReadingDisplay
                    state={streamingState}
                    drawnCards={drawnCards}
                    isDark={isDark}
                  />
                )}

                {/* Complete: full reading with motion reveals */}
                {isReadingReady && reading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ReadingDisplay reading={reading} />



                    <div className="text-center mt-12">
                      <button
                        onClick={reset}
                        style={
                          isDark
                            ? {
                                background: 'transparent',
                                color: 'var(--gold-light)',
                                fontFamily: 'Cinzel, serif',
                                fontSize: 12,
                                letterSpacing: '0.1em',
                                padding: '12px 28px',
                                borderRadius: 2,
                                border: '1px solid rgba(196,146,42,0.45)',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                textTransform: 'uppercase' as const,
                              }
                            : undefined
                        }
                        className={isDark ? '' : 'btn-secondary'}
                      >
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
