'use client';

import { motion } from 'framer-motion';
import { DrawnCard } from '../lib/types';

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

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  vals.forEach((v, i) => { while (n >= v) { result += syms[i]; n -= v; } });
  return result;
}

function StreamCursor() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 2,
        height: '0.85em',
        background: 'var(--gold)',
        marginLeft: 3,
        verticalAlign: 'middle',
        opacity: 0.8,
        animation: 'blink-cursor 1s step-end infinite',
      }}
    />
  );
}

function SkeletonBlock({ lines = 3, isDark }: { lines?: number; isDark: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 2 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 13,
            borderRadius: 2,
            width: i === lines - 1 ? '55%' : i % 2 === 0 ? '100%' : '88%',
            backgroundImage: isDark
              ? 'linear-gradient(90deg, rgba(196,146,42,0.05) 25%, rgba(196,146,42,0.12) 50%, rgba(196,146,42,0.05) 75%)'
              : 'linear-gradient(90deg, rgba(196,146,42,0.07) 25%, rgba(196,146,42,0.14) 50%, rgba(196,146,42,0.07) 75%)',
            backgroundSize: '400% 100%',
            animation: `shimmer 2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

interface Props {
  state: StreamingState;
  drawnCards: DrawnCard[];
  isDark: boolean;
}

export function StreamingReadingDisplay({ state, drawnCards, isDark }: Props) {
  const bodyColor = isDark ? 'rgba(248,244,239,0.82)' : 'var(--brown-mid)';
  const headingColor = isDark ? 'rgba(248,244,239,0.92)' : 'var(--brown-dark)';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.06)' : 'var(--border-brown)';
  const borderGold = isDark ? 'rgba(196,146,42,0.22)' : 'var(--border-gold)';

  // Show synthesis section once any card interpretation has completed
  const showSynthesis = state.synthesis || state.cards.some(c => c.interpretationDone);

  const isWaiting = !state.overallEnergy;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Compact waiting indicator — shows until first token arrives */}
      {isWaiting && (
        <div className="flex items-center justify-center gap-3 py-2">
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: `1px solid rgba(196,146,42,${isDark ? '0.4' : '0.3'})`,
              animation: 'rotate-slow 4s linear infinite',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', color: 'var(--gold)', fontSize: 7 }}>✦</div>
          </div>
          <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 15, fontStyle: 'italic', color: isDark ? 'rgba(248,244,239,0.4)' : 'var(--brown-light)' }}>
            consulting the oracle…
          </p>
        </div>
      )}

      {/* Overall Energy */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--cream-card)',
          border: `1px solid ${borderGold}`,
          borderRadius: 4,
          padding: 'clamp(16px,4vw,24px) clamp(16px,5vw,28px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: borderGold }} />
          <span style={{ color: 'var(--gold)', fontSize: 12, opacity: 0.7 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: borderGold }} />
        </div>
        <p style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 12 }}>
          The Energy of This Reading
        </p>
        {state.overallEnergy ? (
          <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 20, lineHeight: 1.75, fontStyle: 'italic', color: headingColor }}>
            {state.overallEnergy}
            {!state.overallEnergyDone && <StreamCursor />}
          </p>
        ) : (
          <SkeletonBlock lines={2} isDark={isDark} />
        )}
      </motion.div>

      {/* Per-card blocks */}
      {drawnCards.map((drawn, i) => {
        const cardData = state.cards[i];
        const hasKeywords = (cardData?.keywords?.length ?? 0) > 0;
        const hasInterpretation = !!cardData?.interpretation;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i, duration: 0.35 }}
            style={{
              background: isDark ? 'rgba(255,255,255,0.025)' : 'var(--cream-card)',
              border: `1px solid ${borderSubtle}`,
              borderLeft: '3px solid var(--border-gold)',
              borderRadius: 4,
              padding: 'clamp(14px,3.5vw,20px) clamp(14px,4.5vw,24px)',
              position: 'relative',
            }}
          >
            <span style={{ position: 'absolute', top: 12, right: 14, fontFamily: 'Cinzel, serif', fontSize: 11, color: 'var(--border-gold)', letterSpacing: '0.05em', userSelect: 'none' }}>
              {toRoman(i + 1)}
            </span>

            {/* Card name + position — always visible from the start */}
            <div style={{ marginBottom: 10 }}>
              <h4 style={{ fontFamily: 'Cinzel, serif', fontSize: 13, letterSpacing: '0.07em', color: headingColor, marginBottom: 2 }}>
                {drawn.card.name}{drawn.reversed ? ' · Reversed' : ''}
              </h4>
              <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 14, fontStyle: 'italic', color: isDark ? 'rgba(248,244,239,0.45)' : 'var(--brown-light)' }}>
                {drawn.position}
              </p>
            </div>

            {/* Keywords — appear when streamed */}
            {hasKeywords && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}
              >
                {cardData.keywords.map(kw => (
                  <span
                    key={kw}
                    style={{
                      fontFamily: 'EB Garamond, serif',
                      fontSize: 12,
                      color: 'var(--sage)',
                      border: '1px solid rgba(74,122,101,0.25)',
                      borderRadius: 2,
                      padding: '2px 8px',
                      background: 'var(--sage-pale)',
                      fontStyle: 'italic',
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Interpretation — skeleton until streaming starts for this card */}
            {hasInterpretation ? (
              <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 18, lineHeight: 1.72, color: bodyColor }}>
                {cardData.interpretation}
                {!cardData.interpretationDone && <StreamCursor />}
              </p>
            ) : (
              <SkeletonBlock lines={3} isDark={isDark} />
            )}
          </motion.div>
        );
      })}

      {/* Synthesis — skeleton appears after first card completes, fills in when streamed */}
      {showSynthesis && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(196,146,42,0.07) 0%, rgba(255,255,255,0.025) 100%)'
              : 'linear-gradient(135deg, var(--gold-pale) 0%, var(--cream-card) 100%)',
            border: `1px solid rgba(196,146,42,${isDark ? '0.18' : '0.3'})`,
            borderRadius: 4,
            padding: 'clamp(16px,4vw,24px) clamp(16px,5vw,28px)',
            position: 'relative',
          }}
        >
          <span style={{ position: 'absolute', top: 14, right: 18, fontSize: 36, color: 'rgba(196,146,42,0.12)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>✦</span>
          <p style={{ fontFamily: 'Cinzel, serif', fontSize: 10, letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 14 }}>
            What the Cards Say Together
          </p>
          {state.synthesis ? (
            <p style={{ fontFamily: 'EB Garamond, serif', fontSize: 19, lineHeight: 1.72, color: isDark ? 'rgba(248,244,239,0.85)' : 'var(--brown-dark)' }}>
              {state.synthesis}
              {!state.synthesisDone && <StreamCursor />}
            </p>
          ) : (
            <SkeletonBlock lines={4} isDark={isDark} />
          )}

          {state.affirmation && (
            <div style={{ borderTop: `1px solid rgba(196,146,42,${isDark ? '0.15' : '0.2'})`, marginTop: 20, paddingTop: 20 }}>
              <p style={{ fontFamily: 'Pinyon Script, cursive', fontSize: 'clamp(24px,4vw,32px)', color: 'var(--gold)', textAlign: 'center', lineHeight: 1.3, textShadow: '0 0 30px rgba(196,146,42,0.25)' }}>
                &ldquo;{state.affirmation}&rdquo;
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Timing */}
      {state.notableTiming && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
          style={{ fontFamily: 'EB Garamond, serif', fontSize: 16, fontStyle: 'italic', color: isDark ? 'rgba(248,244,239,0.45)' : 'var(--brown-light)' }}
        >
          ☽ {state.notableTiming}
        </motion.p>
      )}
    </div>
  );
}
