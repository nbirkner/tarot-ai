'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { DrawnCard } from '../lib/types';

const ORACLE_PHRASES = [
  'consulting the oracle…',
  'asking the stars to please hold…',
  'negotiating with the cosmos…',
  'the oracle is in — one moment…',
  'shuffling the universe…',
  'Mercury is cooperating (for once)…',
  'reading the vibes… and the cards…',
  'the cards are conferring about you…',
  'contacting the ancient ones…',
  'filing a cosmic inquiry on your behalf…',
  'divining your fate (results may vary)…',
  'the oracle is buffering…',
  'checking what the moon thinks…',
  'your destiny is loading (26%)…',
];

function useRotatingPhrase(phrases: string[], intervalMs = 2800) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % phrases.length), intervalMs);
    return () => clearInterval(t);
  }, [phrases, intervalMs]);
  return phrases[idx];
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
        width: 1.5,
        height: '0.9em',
        background: 'var(--gold)',
        marginLeft: 2,
        verticalAlign: 'middle',
        opacity: 0.7,
        animation: 'blink-cursor 1.1s step-end infinite',
        borderRadius: 1,
      }}
    />
  );
}

function SkeletonBlock({ lines = 3, isDark }: { lines?: number; isDark: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 12,
            borderRadius: 1,
            width: i === lines - 1 ? '52%' : i % 2 === 0 ? '100%' : '86%',
            backgroundImage: isDark
              ? 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 4%, transparent) 0%, color-mix(in srgb, var(--accent) 10%, transparent) 50%, color-mix(in srgb, var(--accent) 4%, transparent) 100%)'
              : 'linear-gradient(90deg, color-mix(in srgb, var(--accent) 6%, transparent) 0%, color-mix(in srgb, var(--accent) 13%, transparent) 50%, color-mix(in srgb, var(--accent) 6%, transparent) 100%)',
            backgroundSize: '300% 100%',
            animation: `shimmer 2.4s ease-in-out ${i * 0.25}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Ornamental section divider
function OrnamentDivider({ isDark }: { isDark: boolean }) {
  const color = isDark ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : 'var(--border-gold)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: color }} />
      <span style={{ color: 'var(--gold)', fontSize: 8, opacity: 0.6, letterSpacing: 6 }}>✦</span>
      <div style={{ flex: 1, height: 1, background: color }} />
    </div>
  );
}

interface Props {
  state: StreamingState;
  drawnCards: DrawnCard[];
  isDark: boolean;
}

export function StreamingReadingDisplay({ state, drawnCards, isDark }: Props) {
  const oraclePhrase = useRotatingPhrase(ORACLE_PHRASES);
  const bodyColor = isDark ? 'color-mix(in srgb, var(--fg) 80%, transparent)' : 'var(--brown-mid)';
  const headingColor = isDark ? 'color-mix(in srgb, var(--fg) 92%, transparent)' : 'var(--brown-dark)';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.05)' : 'var(--border-brown)';
  const borderGold = isDark ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--border-gold)';

  // Show synthesis section once any card interpretation has completed
  const showSynthesis = state.synthesis || state.cards.some(c => c.interpretationDone);

  const isWaiting = !state.overallEnergy;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700, margin: '0 auto' }}>

      {/* Waiting indicator */}
      {isWaiting && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 0' }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
              animation: 'rotate-slow 5s linear infinite',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', color: 'var(--gold)', fontSize: 7 }}>✦</div>
          </div>
          <motion.p
            key={oraclePhrase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontSize: 15,
              fontStyle: 'italic',
              color: isDark ? 'color-mix(in srgb, var(--fg) 38%, transparent)' : 'var(--brown-light)',
              letterSpacing: '0.04em',
            }}
          >
            {oraclePhrase}
          </motion.p>
        </div>
      )}

      {/* Overall Energy */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          background: isDark ? 'rgba(255,255,255,0.025)' : 'var(--cream-card)',
          border: `1px solid ${borderGold}`,
          borderRadius: 3,
          padding: 'clamp(18px,4vw,28px) clamp(18px,5vw,32px)',
          boxShadow: isDark ? 'none' : '0 2px 20px color-mix(in srgb, var(--fg) 7%, transparent), 0 1px 4px color-mix(in srgb, var(--fg) 4%, transparent)',
        }}
      >
        <OrnamentDivider isDark={isDark} />
        <p style={{
          fontFamily: 'var(--font-sans), sans-serif',
          fontSize: 9,
          letterSpacing: '0.01em',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginTop: 14,
          marginBottom: 14,
          opacity: 0.8,
        }}>
          The Energy of This Reading
        </p>
        {state.overallEnergy ? (
          <p style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontSize: 'clamp(18px,2.2vw,22px)',
            lineHeight: 1.72,
            fontStyle: 'italic',
            color: headingColor,
            fontWeight: 400,
          }}>
            {state.overallEnergy}
            {!state.overallEnergyDone && <StreamCursor />}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
            <SkeletonBlock lines={2} isDark={isDark} />
            <p style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontSize: 13,
              fontStyle: 'italic',
              color: isDark ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : 'var(--gold-muted)',
              letterSpacing: '0.03em',
              lineHeight: 1.6,
            }}>
              Your cards are in a closed-door meeting about you right now. Scroll down to follow along.
            </p>
          </div>
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.38 }}
            style={{
              background: isDark ? 'rgba(255,255,255,0.02)' : 'var(--cream-card)',
              border: `1px solid ${borderSubtle}`,
              borderLeft: '1px solid var(--hairline)',
              borderRadius: 3,
              padding: 'clamp(16px,3.5vw,22px) clamp(16px,4.5vw,26px)',
              position: 'relative',
              boxShadow: isDark ? 'none' : '0 2px 16px color-mix(in srgb, var(--fg) 6%, transparent), 0 1px 3px color-mix(in srgb, var(--fg) 4%, transparent)',
            }}
          >
            {/* Roman numeral — top right */}
            <span style={{
              position: 'absolute',
              top: 14,
              right: 16,
              fontFamily: 'var(--font-sans), sans-serif',
              fontSize: 10,
              color: isDark ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : 'color-mix(in srgb, var(--accent) 25%, transparent)',
              letterSpacing: '0.01em',
              userSelect: 'none',
            }}>
              {toRoman(i + 1)}
            </span>

            {/* Card name + position */}
            <div style={{ marginBottom: 12 }}>
              <h4 style={{
                fontFamily: 'var(--font-sans), sans-serif',
                fontSize: 12,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: headingColor,
                marginBottom: 3,
              }}>
                {drawn.card.name}{drawn.reversed ? ' · Reversed' : ''}
              </h4>
              <p style={{
                fontFamily: 'var(--font-sans), sans-serif',
                fontSize: 13,
                fontStyle: 'italic',
                color: isDark ? 'color-mix(in srgb, var(--fg) 38%, transparent)' : 'var(--brown-light)',
                letterSpacing: '0.04em',
              }}>
                {drawn.position}
              </p>
            </div>

            {/* Arcana + suit tags */}
            {(() => {
              const card = drawn.card;
              const arcanaLabel = card.arcana === 'major' ? 'Major Arcana' : 'Minor Arcana';
              const suitLabel = card.suit
                ? card.suit.charAt(0).toUpperCase() + card.suit.slice(1)
                : null;
              const tagStyle = {
                fontFamily: 'var(--font-sans), sans-serif',
                fontSize: 9,
                letterSpacing: '0.01em',
                textTransform: 'uppercase' as const,
                color: isDark ? 'color-mix(in srgb, var(--accent) 75%, transparent)' : 'color-mix(in srgb, var(--accent) 80%, transparent)',
                border: `1px solid ${isDark ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'color-mix(in srgb, var(--accent) 28%, transparent)'}`,
                borderRadius: 1,
                padding: '2px 8px',
                background: isDark ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : 'color-mix(in srgb, var(--accent) 7%, transparent)',
              };
              return (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  <span style={tagStyle}>{arcanaLabel}</span>
                  {suitLabel && <span style={tagStyle}>{suitLabel}</span>}
                </div>
              );
            })()}

            {/* Keywords */}
            {hasKeywords && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}
              >
                {cardData.keywords.map(kw => (
                  <span
                    key={kw}
                    style={{
                      fontFamily: 'var(--font-sans), sans-serif',
                      fontSize: 11,
                      color: isDark ? 'color-mix(in srgb, var(--live) 90%, transparent)' : 'var(--sage)',
                      border: `1px solid ${isDark ? 'color-mix(in srgb, var(--live) 20%, transparent)' : 'color-mix(in srgb, var(--live) 22%, transparent)'}`,
                      borderRadius: 1,
                      padding: '2px 9px',
                      background: isDark ? 'color-mix(in srgb, var(--live) 8%, transparent)' : 'var(--sage-pale)',
                      fontStyle: 'italic',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Interpretation — min-height prevents layout shifts as text streams in */}
            <div style={{ minHeight: 130 }}>
              {hasInterpretation ? (
                <p style={{
                  fontFamily: 'var(--font-sans), sans-serif',
                  fontSize: 'clamp(16px,2vw,19px)',
                  lineHeight: 1.75,
                  color: bodyColor,
                }}>
                  {cardData.interpretation}
                  {!cardData.interpretationDone && <StreamCursor />}
                </p>
              ) : (
                <SkeletonBlock lines={3} isDark={isDark} />
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Synthesis */}
      {showSynthesis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: isDark
              ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, transparent) 0%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(135deg, var(--gold-pale) 0%, var(--cream-card) 100%)',
            border: '1px solid var(--hairline)',
            borderRadius: 3,
            padding: 'clamp(18px,4vw,28px) clamp(18px,5vw,32px)',
            position: 'relative',
            boxShadow: isDark ? 'none' : '0 2px 20px color-mix(in srgb, var(--fg) 7%, transparent), 0 1px 4px color-mix(in srgb, var(--fg) 4%, transparent)',
          }}
        >
          {/* Large background ✦ */}
          <span style={{
            position: 'absolute',
            top: 16,
            right: 20,
            fontSize: 40,
            color: isDark ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'color-mix(in srgb, var(--accent) 10%, transparent)',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}>✦</span>

          <OrnamentDivider isDark={isDark} />
          <p style={{
            fontFamily: 'var(--font-sans), sans-serif',
            fontSize: 9,
            letterSpacing: '0.01em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginTop: 14,
            marginBottom: 16,
            opacity: 0.8,
          }}>
            What the Cards Say Together
          </p>

          {state.synthesis ? (
            <p style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontSize: 'clamp(17px,2vw,20px)',
              lineHeight: 1.75,
              color: isDark ? 'color-mix(in srgb, var(--fg) 85%, transparent)' : 'var(--brown-dark)',
            }}>
              {state.synthesis}
              {!state.synthesisDone && <StreamCursor />}
            </p>
          ) : (
            <SkeletonBlock lines={4} isDark={isDark} />
          )}

          {state.affirmation && (
            <div style={{
              borderTop: '1px solid var(--hairline)',
              marginTop: 24,
              paddingTop: 22,
            }}>
              <p style={{
                fontFamily: 'var(--font-sans), var(--font-sans), sans-serif',
                fontSize: 'clamp(26px,4vw,36px)',
                color: 'var(--gold)',
                textAlign: 'center',
                lineHeight: 1.3,
                textShadow: isDark ? '0 0 40px color-mix(in srgb, var(--accent) 22%, transparent)' : '0 0 20px color-mix(in srgb, var(--accent) 15%, transparent)',
              }}>
                &ldquo;{state.affirmation}&rdquo;
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Timing */}
      {state.notableTiming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '4px 0' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ height: 1, width: 32, background: isDark ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--border-gold)' }} />
            <p style={{
              fontFamily: 'var(--font-sans), sans-serif',
              fontSize: 14,
              fontStyle: 'italic',
              color: isDark ? 'color-mix(in srgb, var(--fg) 38%, transparent)' : 'var(--brown-light)',
              letterSpacing: '0.04em',
            }}>
              ☽ {state.notableTiming}
            </p>
            <div style={{ height: 1, width: 32, background: isDark ? 'color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--border-gold)' }} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
