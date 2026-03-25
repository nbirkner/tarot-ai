'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpreadSelector } from '../../components/SpreadSelector';
import { DeckSelector } from '../../components/DeckSelector';
import { AstrologyInput } from '../../components/AstrologyInput';
import { QuestionInput } from '../../components/QuestionInput';
import { TarotCard } from '../../components/TarotCard';
import { ReadingDisplay } from '../../components/ReadingDisplay';
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

type Step = 'question' | 'spread' | 'deck' | 'astrology' | 'generating' | 'reading';

export default function ReadingPage() {
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [spreadType, setSpreadType] = useState<SpreadType>('three');
  const [deckStyle, setDeckStyle] = useState<DeckStyle>('dark-gothic');
  const [astrology, setAstrology] = useState<AstrologyInputType>({ type: 'none' });
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalSpend, setTotalSpend] = useState(0);

  const BUDGET_LIMIT = 100;

  async function startReading() {
    if (totalSpend >= BUDGET_LIMIT) {
      setError('Budget limit reached. Reading disabled.');
      return;
    }

    setStep('generating');
    setError(null);

    const spread = getSpread(spreadType);
    const cards = drawCards(spread.cardCount);
    const now = new Date();
    const userId = getUserId();
    const dateStr = now.toISOString().split('T')[0];

    // Initialize drawn cards without images
    const initialDrawn: DrawnCard[] = cards.map((card, i) => ({
      card,
      position: spread.positions[i],
      reversed: isReversed(),
    }));
    setDrawnCards(initialDrawn);

    // Track resolved images in a local array (avoids stale closure when building final result)
    const resolvedImages: (string | undefined)[] = new Array(initialDrawn.length).fill(undefined);
    // Track which cards have their image ready (for ordered reveal)
    const imageReady: boolean[] = new Array(initialDrawn.length).fill(false);

    // Reveal cards in positional order: card i reveals only after its image is ready
    // AND all previous cards have already been revealed
    function attemptReveal(upToIndex: number) {
      let next = upToIndex;
      while (next < initialDrawn.length && imageReady[next]) {
        next++;
      }
      setRevealedCount(next);
      setDrawnCards(initialDrawn.map((d, i) => ({ ...d, imageUrl: resolvedImages[i] })));
    }

    // Generate all card images in parallel
    const imagePromises = initialDrawn.map(async (drawn, i) => {
      try {
        const res = await fetch('/api/generate-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardName: drawn.card.name,
            deckStyle,
            userId,
            date: dateStr,
          }),
        });
        const data = await res.json();
        resolvedImages[i] = data.imageUrl;
        setTotalSpend((prev) => prev + (data.estimatedCost || 0));
      } catch {
        console.error(`Failed to generate image for ${drawn.card.name}`);
      } finally {
        imageReady[i] = true;
        attemptReveal(0);
      }
    });

    await Promise.all(imagePromises);

    // Generate the reading interpretation
    const context = buildReadingContext(now);
    const astrologyContext = formatAstrologyContext(astrology, now);
    void astrologyContext;

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
        ...context,
      }),
    });

    const readingData = await readingRes.json();
    setTotalSpend((prev) => prev + (readingData.estimatedCost || 0));

    // Use resolvedImages (local array) not drawnCards state — avoids stale closure
    const result: ReadingResult = {
      id: crypto.randomUUID(),
      date: now.toISOString(),
      question,
      spreadType,
      deckStyle,
      cards: initialDrawn.map((d, i) => ({ ...d, imageUrl: resolvedImages[i] })),
      overallEnergy: readingData.overallEnergy || '',
      cardReadings: readingData.cardReadings || [],
      synthesis: readingData.synthesis || '',
      affirmation: readingData.affirmation || '',
      notableTiming: readingData.notableTiming || '',
    };

    saveReading(result);
    setReading(result);
    setStep('reading');
  }

  function reset() {
    setStep('question');
    setQuestion('');
    setDrawnCards([]);
    setRevealedCount(0);
    setReading(null);
    setError(null);
  }

  const STEP_TITLES: Record<Step, string> = {
    question: 'What would you like to ask?',
    spread: 'Choose your spread',
    deck: 'Choose your deck',
    astrology: 'Add your astrological context',
    generating: 'Drawing your cards...',
    reading: 'Your reading',
  };

  return (
    <main className="min-h-screen bg-slate-950 pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {step !== 'generating' && step !== 'reading' && (
              <h2 className="text-purple-200 text-xl font-semibold">{STEP_TITLES[step]}</h2>
            )}

            {error && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-lg p-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            {step === 'question' && (
              <div className="space-y-6">
                <QuestionInput
                  value={question}
                  onChange={setQuestion}
                  onSkip={() => setStep('spread')}
                />
                <button
                  onClick={() => setStep('spread')}
                  className="w-full py-3 bg-purple-800 hover:bg-purple-700 text-purple-100 rounded-full font-medium transition-colors text-sm"
                >
                  Continue →
                </button>
              </div>
            )}

            {step === 'spread' && (
              <div className="space-y-6">
                <SpreadSelector value={spreadType} onChange={setSpreadType} />
                <button
                  onClick={() => setStep('deck')}
                  className="w-full py-3 bg-purple-800 hover:bg-purple-700 text-purple-100 rounded-full font-medium transition-colors text-sm"
                >
                  Continue →
                </button>
              </div>
            )}

            {step === 'deck' && (
              <div className="space-y-6">
                <DeckSelector value={deckStyle} onChange={setDeckStyle} />
                <button
                  onClick={() => setStep('astrology')}
                  className="w-full py-3 bg-purple-800 hover:bg-purple-700 text-purple-100 rounded-full font-medium transition-colors text-sm"
                >
                  Continue →
                </button>
              </div>
            )}

            {step === 'astrology' && (
              <div className="space-y-6">
                <p className="text-purple-400 text-sm">
                  Optional — helps personalize your reading. Nothing is saved.
                </p>
                <AstrologyInput value={astrology} onChange={setAstrology} />
                <button
                  onClick={startReading}
                  className="w-full py-3 bg-purple-800 hover:bg-purple-700 text-purple-100 rounded-full font-medium transition-colors text-sm"
                >
                  Draw my cards →
                </button>
              </div>
            )}

            {step === 'generating' && (
              <div className="space-y-8">
                <div className="text-center">
                  <p className="text-purple-300 text-lg">Drawing your cards...</p>
                  <p className="text-purple-500 text-sm mt-1">Each card is being uniquely generated for you</p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  {drawnCards.map((drawn, i) => (
                    <TarotCard
                      key={i}
                      drawn={drawn}
                      isRevealed={i < revealedCount}
                      isLoading={!drawn.imageUrl && i >= revealedCount}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 'reading' && reading && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-purple-200 text-xl font-semibold">{STEP_TITLES.reading}</h2>
                  {question && <p className="text-purple-500 text-sm mt-1">"{question}"</p>}
                </div>
                <ReadingDisplay reading={reading} />
                <button
                  onClick={reset}
                  className="w-full py-3 border border-purple-800 hover:border-purple-600 text-purple-400 hover:text-purple-200 rounded-full font-medium transition-colors text-sm"
                >
                  New reading
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
