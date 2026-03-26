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
              fontFamily: 'EB Garamond, serif',
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
    subtitle: 'Optional — helps the cards speak to your specific situation.',
  },
  spread: {
    title: 'Choose your spread',
    subtitle: 'How many cards shall the oracle draw?',
  },
  deck: {
    title: 'Choose your deck',
    subtitle: 'Each style conjures a different energy.',
  },
  photo: {
    title: 'Add your photo',
    subtitle: 'Optional — lets the cards mirror your likeness.',
  },
  astrology: {
    title: 'Your astrological self',
    subtitle: 'Optional — deepens the reading. Nothing is saved.',
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

// Extract progressively readable fields from a partial JSON buffer
function extractStreamingFields(buf: string, cardCount: number): Partial<StreamingState> {
  const u: Partial<StreamingState> = {};

  // overallEnergy — streams character by character
  const oe = buf.match(/"overallEnergy"\s*:\s*"((?:[^"\\]|\\.)*)(")?/);
  if (oe?.[1] !== undefined) {
    u.overallEnergy = unescapeJson(oe[1]);
    u.overallEnergyDone = oe[2] === '"';
  }

  // Card keywords (only when the full array is present) + interpretations (stream)
  const kwAll = [...buf.matchAll(/"keywords"\s*:\s*(\[[^\]]*\])/g)];
  const intAll = [...buf.matchAll(/"interpretation"\s*:\s*"((?:[^"\\]|\\.)*)(")?/g)];
  if (kwAll.length > 0 || intAll.length > 0) {
    u.cards = Array.from({ length: cardCount }, (_, i) => {
      let keywords: string[] = [];
      let interpretation = '';
      let interpretationDone = false;
      if (kwAll[i]) { try { keywords = JSON.parse(kwAll[i][1]); } catch {} }
      if (intAll[i]) {
        interpretation = unescapeJson(intAll[i][1]);
        interpretationDone = intAll[i][2] === '"';
      }
      return { keywords, interpretation, interpretationDone };
    });
  }

  // synthesis — streams
  const syn = buf.match(/"synthesis"\s*:\s*"((?:[^"\\]|\\.)*)(")?/);
  if (syn?.[1] !== undefined) {
    u.synthesis = unescapeJson(syn[1]);
    u.synthesisDone = syn[2] === '"';
  }

  // affirmation — only when the closing quote is visible
  const aff = buf.match(/"affirmation"\s*:\s*"((?:[^"\\]|\\.)*)"(?=\s*[,}\n])/);
  if (aff) u.affirmation = unescapeJson(aff[1]);

  // notableTiming — only when the closing quote is visible
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
  const resolvedImagesRef = useRef<(string | undefined)[]>([]);

  const allFlipped = drawnCards.length > 0 && flippedCards.size === drawnCards.length;

  function flipCard(index: number) {
    if (!isReadingReady) return;
    setFlippedCards((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }

  async function startReading() {
    setStep('generating');
    setError(null);
    setIsReadingReady(false);
    setFlippedCards(new Set());
    setStreamingState(null);

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

    // Option 3: Fire images independently — each updates drawnCards as it resolves
    initialDrawn.forEach(async (drawn, i) => {
      try {
        const res = await fetch('/api/generate-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardName: drawn.card.name,
            deckStyle,
            userId,
            date: dateStr,
            ...(userPhoto ? { userPhotoBase64: userPhoto } : {}),
          }),
        });
        const data = await res.json();
        if (data.imageUrl) {
          resolvedImagesRef.current[i] = data.imageUrl;
          setDrawnCards((prev) =>
            prev.map((d, j) => (j === i ? { ...d, imageUrl: data.imageUrl } : d))
          );
        }
      } catch {
        console.error(`Image gen failed for ${drawn.card.name}`);
      }
    });

    const context = buildReadingContext(now);
    const formattedAstrology = formatAstrologyContext(astrology, now);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);

      let readingRes: Response;
      try {
        readingRes = await fetch('/api/generate-reading', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            question,
            spreadType,
            cards: initialDrawn.map((d) => ({
              name: d.card.name,
              position: d.position,
              reversed: d.reversed,
            })),
            astrology,
            formattedAstrology,
            userContext: userContext || undefined,
            ...context,
          }),
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!readingRes.ok) {
        const errText = await readingRes.text().catch(() => '');
        console.error('Reading API error:', readingRes.status, errText);
        setStreamingState(null);
        setError(`The oracle fell silent (${readingRes.status}). Please try again.`);
        return;
      }

      // Read the SSE stream and fill in skeleton blocks as tokens arrive
      const reader = readingRes.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let accumulatedJson = '';
      const cardCount = initialDrawn.length;

      try {
        outer: while (true) {
          const { done, value } = await reader.read();
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
                accumulatedJson += token;
                const fields = extractStreamingFields(accumulatedJson, cardCount);
                if (Object.keys(fields).length > 0) {
                  setStreamingState(prev => prev ? { ...prev, ...fields } : prev);
                }
              }
            } catch {}
          }
        }
      } finally {
        reader.releaseLock();
      }

      const cleanContent = accumulatedJson
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      const readingData = JSON.parse(cleanContent);

      const result: ReadingResult = {
        id: crypto.randomUUID(),
        date: now.toISOString(),
        question,
        spreadType,
        deckStyle,
        cards: initialDrawn.map((d, i) => ({ ...d, imageUrl: resolvedImagesRef.current[i] })),
        overallEnergy: readingData.overallEnergy || '',
        cardReadings: readingData.cardReadings || [],
        synthesis: readingData.synthesis || '',
        affirmation: readingData.affirmation || '',
        notableTiming: readingData.notableTiming || '',
      };

      saveReading(result);
      setReading(result);
      setIsReadingReady(true); // Cards now glow and are clickable — images may still be loading
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
  const isDark = !isSetupStep;

  // Background styles
  const lightBg = 'var(--cream)';
  const darkBg =
    'radial-gradient(ellipse at 50% 0%, #2A1A0A 0%, #0F0805 60%, #080504 100%)';
  const candleGlow =
    'radial-gradient(ellipse at 50% 80%, rgba(196,146,42,0.15) 0%, transparent 60%)';

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
                <div className="text-center space-y-2 pt-6">
                  <h2
                    style={{
                      fontFamily: 'Cinzel, serif',
                      fontSize: 22,
                      color: 'var(--brown-dark)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {STEP_CONFIG[step as keyof typeof STEP_CONFIG]?.title}
                  </h2>
                  {STEP_CONFIG[step as keyof typeof STEP_CONFIG]?.subtitle && (
                    <p
                      style={{
                        fontFamily: 'EB Garamond, serif',
                        fontSize: 17,
                        color: 'var(--brown-mid)',
                        fontStyle: 'italic',
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
                      fontFamily: 'EB Garamond, serif',
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
                    >
                      ← Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {step === 'astrology' ? (
                    <button onClick={startReading} className="btn-primary">
                      Draw the Cards
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const i = SETUP_STEPS.indexOf(step as (typeof SETUP_STEPS)[number]);
                        setStep(SETUP_STEPS[i + 1]);
                      }}
                      className="btn-primary"
                    >
                      Continue →
                    </button>
                  )}
                </div>

                {/* Step indicator */}
                <div className="flex justify-center gap-2 pt-2">
                  {SETUP_STEPS.map((s) => (
                    <div
                      key={s}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: s === step ? 'var(--gold)' : 'var(--border-gold)',
                        border: '1px solid var(--gold-muted)',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Generating + Reveal state — dark atmosphere */}
            {(step === 'generating' || isReadingReady) && (
              <div className="space-y-10">
                {/* Page title */}
                <div className="text-center pt-4">
                  {question && (
                    <p
                      style={{
                        fontFamily: 'EB Garamond, serif',
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
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: 14,
                        letterSpacing: '0.12em',
                        color: 'var(--gold)',
                      }}
                    >
                      YOUR CARDS AWAIT — CLICK EACH TO REVEAL
                    </motion.p>
                  )}
                </div>

                {/* Cards spread */}
                <div
                  className={`flex flex-wrap gap-6 justify-center items-end ${
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
                    <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 18, fontStyle: 'italic', color: isDark ? 'rgba(248,244,239,0.6)' : 'var(--brown-light)' }}>
                      {error}
                    </p>
                    <button onClick={startReading} className="btn-primary">Try Again</button>
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

                    {/* Download buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
                      <button
                        onClick={async () => {
                          const { downloadReadingPDF } = await import('../../lib/pdf');
                          await downloadReadingPDF(reading);
                        }}
                        style={{
                          background: 'transparent',
                          color: 'var(--gold-light)',
                          fontFamily: 'Cinzel, serif',
                          fontSize: 11,
                          letterSpacing: '0.12em',
                          padding: '11px 24px',
                          borderRadius: 2,
                          border: '1px solid rgba(196,146,42,0.5)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          textTransform: 'uppercase' as const,
                          minWidth: 200,
                        }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(196,146,42,0.1)'; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.background = 'transparent'; }}
                      >
                        ↓ Download Reading
                      </button>
                      <button
                        onClick={async () => {
                          const { downloadCardsPDF } = await import('../../lib/pdf');
                          await downloadCardsPDF(reading);
                        }}
                        style={{
                          background: 'transparent',
                          color: isDark ? 'rgba(248,244,239,0.45)' : 'var(--brown-light)',
                          fontFamily: 'Cinzel, serif',
                          fontSize: 11,
                          letterSpacing: '0.12em',
                          padding: '11px 24px',
                          borderRadius: 2,
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'var(--border-brown)'}`,
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          textTransform: 'uppercase' as const,
                          minWidth: 200,
                        }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(196,146,42,0.35)'; (e.target as HTMLElement).style.color = 'var(--gold-muted)'; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'var(--border-brown)'; (e.target as HTMLElement).style.color = isDark ? 'rgba(248,244,239,0.45)' : 'var(--brown-light)'; }}
                      >
                        ↓ Print Cards
                      </button>
                    </div>

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
