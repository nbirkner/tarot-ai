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
              fontFamily: 'Cormorant Garamond, serif',
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

function extractStringField(partial: string, key: string): { text: string; done: boolean } | null {
  // Check for complete field first
  const completeRe = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
  const completeMatch = partial.match(completeRe);
  if (completeMatch) return { text: unescapeJson(completeMatch[1]), done: true };

  // Check for in-progress field
  const partialRe = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)$`, 's');
  const partialMatch = partial.match(partialRe);
  if (partialMatch && partialMatch[1].length > 3) return { text: unescapeJson(partialMatch[1]), done: false };

  return null;
}

function extractCardInterpretations(partial: string, count: number): StreamingState['cards'] {
  const cards: StreamingState['cards'] = Array.from({ length: count }, () => ({
    keywords: [],
    interpretation: '',
    interpretationDone: false,
  }));

  // Keywords: find each "keywords": [...] array
  const kwRe = /"keywords"\s*:\s*\[([^\]]*)\]/g;
  let kwMatch;
  let kwIdx = 0;
  while ((kwMatch = kwRe.exec(partial)) !== null && kwIdx < count) {
    try { cards[kwIdx].keywords = JSON.parse(`[${kwMatch[1]}]`); } catch {}
    kwIdx++;
  }

  // Interpretations: find each "interpretation": "..." (complete or in-progress)
  const interpRe = /"interpretation"\s*:\s*"/g;
  let interpMatch;
  let interpIdx = 0;
  while ((interpMatch = interpRe.exec(partial)) !== null && interpIdx < count) {
    const afterOpen = partial.slice(interpMatch.index + interpMatch[0].length);
    // Walk characters to find unescaped closing quote
    let closeIdx = -1;
    let j = 0;
    while (j < afterOpen.length) {
      if (afterOpen[j] === '\\') { j += 2; continue; }
      if (afterOpen[j] === '"') { closeIdx = j; break; }
      j++;
    }
    if (closeIdx !== -1) {
      cards[interpIdx].interpretation = unescapeJson(afterOpen.slice(0, closeIdx));
      cards[interpIdx].interpretationDone = true;
    } else {
      cards[interpIdx].interpretation = unescapeJson(afterOpen);
      cards[interpIdx].interpretationDone = false;
    }
    interpIdx++;
  }

  return cards;
}

function extractStreamingState(partial: string, cardCount: number): StreamingState | null {
  const energy = extractStringField(partial, 'overallEnergy');
  if (!energy) return null; // nothing meaningful yet

  const synthesis = extractStringField(partial, 'synthesis');
  const affirmation = extractStringField(partial, 'affirmation');
  const timing = extractStringField(partial, 'notableTiming');

  return {
    overallEnergy: energy.text,
    overallEnergyDone: energy.done,
    cards: extractCardInterpretations(partial, cardCount),
    synthesis: synthesis?.text ?? '',
    synthesisDone: synthesis?.done ?? false,
    affirmation: affirmation?.text ?? '',
    notableTiming: timing?.text ?? '',
  };
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

    // Option 2: Stream the reading — cards become ready as soon as text is done
    const context = buildReadingContext(now);
    const formattedAstrology = formatAstrologyContext(astrology, now);

    try {
      const readingRes = await fetch('/api/generate-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (!readingRes.ok || !readingRes.body) {
        setError('The oracle is silent. Please try again.');
        setStep('question');
        return;
      }

      // Consume SSE stream
      const reader = readingRes.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let jsonText = '';

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break outer;
          try {
            const chunk = JSON.parse(payload);
            const token: string = chunk.choices?.[0]?.delta?.content ?? '';
            if (token) {
              jsonText += token;
              const state = extractStreamingState(jsonText, initialDrawn.length);
              if (state) setStreamingState(state);
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }

      // Strip markdown fences if model wrapped the JSON
      const cleanJson = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const readingData = JSON.parse(cleanJson);

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
      setError('The oracle is silent. Please try again.');
      setStep('question');
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
                        fontFamily: 'Cormorant Garamond, serif',
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
                      fontFamily: 'Cormorant Garamond, serif',
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
                        fontFamily: 'Cormorant Garamond, serif',
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

                {/* Ornamental divider before reading sections */}
                {streamingState && (
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(196,146,42,0.3)' : 'var(--border-gold)' }} />
                    <span style={{ color: 'var(--gold)', fontSize: 14 }}>✦ ✦ ✦</span>
                    <div className="flex-1 h-px" style={{ background: isDark ? 'rgba(196,146,42,0.3)' : 'var(--border-gold)' }} />
                  </div>
                )}

                {/* Pre-stream: WitchyLoader */}
                {!streamingState && !isReadingReady && <WitchyLoader />}

                {/* Streaming: skeleton blocks filling in */}
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
