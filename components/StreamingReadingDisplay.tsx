'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { DrawnCard } from '../lib/types';
import { Sigil } from './Sigil';

const ORACLE_PHRASES = [
  'Consulting the oracle.',
  'Asking the stars to please hold.',
  'Negotiating with the cosmos.',
  'The oracle will be right with you.',
  'Shuffling the universe.',
  'Mercury is cooperating, for once.',
  'The cards are conferring.',
  'Filing a cosmic inquiry.',
  'Divining your fate. Results may vary.',
  'The oracle is buffering.',
  'Checking what the moon thinks.',
  'Your destiny is loading. About 26 percent.',
];

function useRotatingPhrase(phrases: string[], intervalMs = 2800) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % phrases.length), intervalMs);
    return () => clearInterval(t);
  }, [phrases, intervalMs, reduce]);
  return phrases[reduce ? 0 : idx];
}

export interface StreamingState {
  overallEnergy: string;
  overallEnergyDone: boolean;
  cards: Array<{
    keywords: string[];
    interpretation: string;
    interpretationDone: boolean;
  }>;
  synthesis: string;
  synthesisDone: boolean;
  affirmation: string;
  notableTiming: string;
}

function StreamCursor() {
  return <span className="cursor" aria-hidden="true" />;
}

function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: i === lines - 1 ? '58%' : '100%' }} />
      ))}
    </div>
  );
}

interface Props {
  state: StreamingState;
  drawnCards: DrawnCard[];
}

export function StreamingReadingDisplay({ state, drawnCards }: Props) {
  const reduce = useReducedMotion();
  const oraclePhrase = useRotatingPhrase(ORACLE_PHRASES);
  const showSynthesis = state.synthesis || state.cards.some((c) => c.interpretationDone);
  const isWaiting = !state.overallEnergy;

  return (
    <div className="stream" aria-busy="true" aria-live="polite">
      {isWaiting && (
        <div className="stream-status">
          <Sigil className="sigil spin-mark" />
          <motion.p
            key={oraclePhrase}
            className="fine"
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.3 }}
          >
            {oraclePhrase}
          </motion.p>
        </div>
      )}

      <section className="thought">
        <h2 className="thought-title">The Cards Have a Thought</h2>
        {state.overallEnergy ? (
          <p className="thought-lead">
            {state.overallEnergy}
            {!state.overallEnergyDone && <StreamCursor />}
          </p>
        ) : (
          <div>
            <SkeletonBlock lines={2} />
            <p className="fine" style={{ marginTop: 12 }}>
              Your cards are in a closed-door meeting about you right now.
            </p>
          </div>
        )}
      </section>

      <ol className="card-readings">
        {drawnCards.map((drawn, i) => {
          const cardData = state.cards[i];
          const hasKeywords = (cardData?.keywords?.length ?? 0) > 0;
          const hasInterpretation = !!cardData?.interpretation;
          const card = drawn.card;
          const arcanaLabel = card.arcana === 'major' ? 'Major Arcana' : 'Minor Arcana';
          const suitLabel = card.suit ? card.suit.charAt(0).toUpperCase() + card.suit.slice(1) : null;

          return (
            <li key={`${drawn.card.name}-${i}`} className="card-reading">
              <p className="mono-label">
                {String(i + 1).padStart(2, '0')} / {drawn.position}
                {drawn.reversed ? ' / Reversed' : ''}
              </p>
              <h3>{drawn.card.name}</h3>
              <div className="keyword-row">
                <span className="meta-tag">{arcanaLabel}</span>
                {suitLabel && <span className="meta-tag">{suitLabel}</span>}
              </div>
              {hasKeywords && (
                <div className="keyword-row">
                  {cardData.keywords.map((kw) => (
                    <span key={kw} className="keyword">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ minHeight: 96 }}>
                {hasInterpretation ? (
                  <p className="body">
                    {cardData.interpretation}
                    {!cardData.interpretationDone && <StreamCursor />}
                  </p>
                ) : (
                  <SkeletonBlock lines={3} />
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {showSynthesis && (
        <section className="thought">
          <h2 className="thought-title">What the Cards Say Together</h2>
          {state.synthesis ? (
            <p className="thought-lead">
              {state.synthesis}
              {!state.synthesisDone && <StreamCursor />}
            </p>
          ) : (
            <SkeletonBlock lines={4} />
          )}
          {state.affirmation && <p className="affirmation">&ldquo;{state.affirmation}&rdquo;</p>}
        </section>
      )}

      {state.notableTiming && <p className="timing">{state.notableTiming}</p>}
    </div>
  );
}
