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
              ? 'linear-gradient(90deg, rgba(196,146,42,0.04) 0%, rgba(196,146,42,0.1) 50%, rgba(196,146,42,0.04) 100%)'
              : 'linear-gradient(90deg, rgba(196,146,42,0.06) 0%, rgba(196,146,42,0.13) 50%, rgba(196,146,42,0.06) 100%)',
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
  const color = isDark ? 'rgba(196,146,42,0.25)' : 'var(--border-gold)';
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
  const bodyColor = isDark ? 'rgba(248,244,239,0.8)' : 'var(--brown-mid)';
  const headingColor = isDark ? 'rgba(248,244,239,0.92)' : 'var(--brown-dark)';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.05)' : 'var(--border-brown)';
  const borderGold = isDark ? 'rgba(196,146,42,0.2)' : 'var(--border-gold)';

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
              border: `1px solid rgba(196,146,42,${isDark ? '0.35' : '0.28'})`,
              animation: 'rotate-slow 5s linear infinite',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', color: 'var(--gold)', fontSize: 7 }}>✦</div>
          </div>
          <p style={{
            fontFamily: 'var(--font-spectral), Spectral, serif',
            fontSize: 15,
            fontStyle: 'italic',
            color: isDark ? 'rgba(248,244,239,0.38)' : 'var(--brown-light)',
            letterSpacing: '0.04em',
          }}>
            consulting the oracle…
          </p>
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
        }}
      >
        <OrnamentDivider isDark={isDark} />
        <p style={{
          fontFamily: 'var(--font-cinzel), Cinzel, serif',
          fontSize: 9,
          letterSpacing: '0.25em',
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
            fontFamily: 'var(--font-spectral), Spectral, serif',
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
              fontFamily: 'var(--font-spectral), Spectral, serif',
              fontSize: 13,
              fontStyle: 'italic',
              color: isDark ? 'rgba(196,146,42,0.5)' : 'var(--gold-muted)',
              letterSpacing: '0.03em',
              lineHeight: 1.6,
            }}>
              The synthesis appears once the card readings below finish — scroll down to follow along.
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
              borderLeft: `2px solid rgba(196,146,42,${isDark ? '0.3' : '0.25'})`,
              borderRadius: 3,
              padding: 'clamp(16px,3.5vw,22px) clamp(16px,4.5vw,26px)',
              position: 'relative',
            }}
          >
            {/* Roman numeral — top right */}
            <span style={{
              position: 'absolute',
              top: 14,
              right: 16,
              fontFamily: 'var(--font-cinzel), Cinzel, serif',
              fontSize: 10,
              color: isDark ? 'rgba(196,146,42,0.3)' : 'rgba(196,146,42,0.25)',
              letterSpacing: '0.08em',
              userSelect: 'none',
            }}>
              {toRoman(i + 1)}
            </span>

            {/* Card name + position */}
            <div style={{ marginBottom: 12 }}>
              <h4 style={{
                fontFamily: 'var(--font-cinzel), Cinzel, serif',
                fontSize: 12,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: headingColor,
                marginBottom: 3,
              }}>
                {drawn.card.name}{drawn.reversed ? ' · Reversed' : ''}
              </h4>
              <p style={{
                fontFamily: 'var(--font-spectral), Spectral, serif',
                fontSize: 13,
                fontStyle: 'italic',
                color: isDark ? 'rgba(248,244,239,0.38)' : 'var(--brown-light)',
                letterSpacing: '0.04em',
              }}>
                {drawn.position}
              </p>
            </div>

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
                      fontFamily: 'var(--font-spectral), Spectral, serif',
                      fontSize: 11,
                      color: isDark ? 'rgba(122,175,158,0.9)' : 'var(--sage)',
                      border: `1px solid ${isDark ? 'rgba(74,122,101,0.2)' : 'rgba(74,122,101,0.22)'}`,
                      borderRadius: 1,
                      padding: '2px 9px',
                      background: isDark ? 'rgba(74,122,101,0.08)' : 'var(--sage-pale)',
                      fontStyle: 'italic',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Interpretation */}
            {hasInterpretation ? (
              <p style={{
                fontFamily: 'var(--font-spectral), Spectral, serif',
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
              ? 'linear-gradient(135deg, rgba(196,146,42,0.06) 0%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(135deg, var(--gold-pale) 0%, var(--cream-card) 100%)',
            border: `1px solid rgba(196,146,42,${isDark ? '0.16' : '0.28'})`,
            borderRadius: 3,
            padding: 'clamp(18px,4vw,28px) clamp(18px,5vw,32px)',
            position: 'relative',
          }}
        >
          {/* Large background ✦ */}
          <span style={{
            position: 'absolute',
            top: 16,
            right: 20,
            fontSize: 40,
            color: isDark ? 'rgba(196,146,42,0.08)' : 'rgba(196,146,42,0.1)',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}>✦</span>

          <OrnamentDivider isDark={isDark} />
          <p style={{
            fontFamily: 'var(--font-cinzel), Cinzel, serif',
            fontSize: 9,
            letterSpacing: '0.25em',
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
              fontFamily: 'var(--font-spectral), Spectral, serif',
              fontSize: 'clamp(17px,2vw,20px)',
              lineHeight: 1.75,
              color: isDark ? 'rgba(248,244,239,0.85)' : 'var(--brown-dark)',
            }}>
              {state.synthesis}
              {!state.synthesisDone && <StreamCursor />}
            </p>
          ) : (
            <SkeletonBlock lines={4} isDark={isDark} />
          )}

          {state.affirmation && (
            <div style={{
              borderTop: `1px solid rgba(196,146,42,${isDark ? '0.14' : '0.18'})`,
              marginTop: 24,
              paddingTop: 22,
            }}>
              <p style={{
                fontFamily: 'var(--font-pinyon), Pinyon Script, cursive',
                fontSize: 'clamp(26px,4vw,36px)',
                color: 'var(--gold)',
                textAlign: 'center',
                lineHeight: 1.3,
                textShadow: isDark ? '0 0 40px rgba(196,146,42,0.22)' : '0 0 20px rgba(196,146,42,0.15)',
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
            <div style={{ height: 1, width: 32, background: isDark ? 'rgba(196,146,42,0.2)' : 'var(--border-gold)' }} />
            <p style={{
              fontFamily: 'var(--font-spectral), Spectral, serif',
              fontSize: 14,
              fontStyle: 'italic',
              color: isDark ? 'rgba(248,244,239,0.38)' : 'var(--brown-light)',
              letterSpacing: '0.04em',
            }}>
              ☽ {state.notableTiming}
            </p>
            <div style={{ height: 1, width: 32, background: isDark ? 'rgba(196,146,42,0.2)' : 'var(--border-gold)' }} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
