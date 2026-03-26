'use client';

import { motion } from 'framer-motion';
import { ReadingResult } from '../lib/types';

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  vals.forEach((v, i) => { while(n >= v) { result += syms[i]; n -= v; } });
  return result;
}

interface ReadingDisplayProps {
  reading: ReadingResult;
}

export function ReadingDisplay({ reading }: ReadingDisplayProps) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Overall energy */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'var(--cream-card)',
          border: '1px solid var(--border-gold)',
          borderRadius: 4,
          padding: 'clamp(16px, 4vw, 28px) clamp(16px, 5vw, 32px)',
        }}
      >
        {/* Ornamental divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
          <span style={{ color: 'var(--gold)', fontSize: 14, opacity: 0.7 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
        </div>
        <p
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'var(--gold)',
            textTransform: 'uppercase' as const,
            marginBottom: 14,
          }}
        >
          The Energy of This Reading
        </p>
        <p
          style={{
            fontFamily: 'EB Garamond, serif',
            fontSize: 22,
            lineHeight: 1.7,
            color: 'var(--brown-dark)',
            fontStyle: 'italic',
          }}
        >
          {reading.overallEnergy}
        </p>
      </motion.div>

      {/* Per-card readings */}
      <div className="space-y-4">
        {reading.cardReadings.map((cr, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
            style={{
              background: 'var(--cream-card)',
              border: '1px solid var(--border-brown)',
              borderLeft: '3px solid var(--border-gold)',
              borderRadius: 4,
              padding: 'clamp(14px, 3.5vw, 22px) clamp(14px, 4.5vw, 28px)',
              position: 'relative' as const,
            }}
          >
            {/* Roman numeral decorative */}
            <span
              style={{
                position: 'absolute',
                top: 12,
                right: 14,
                fontFamily: 'Cinzel, serif',
                fontSize: 11,
                color: 'var(--border-gold)',
                letterSpacing: '0.05em',
                userSelect: 'none',
              }}
            >
              {toRoman(i + 1)}
            </span>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div>
                <h4
                  style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: 13,
                    letterSpacing: '0.07em',
                    color: 'var(--brown-dark)',
                    marginBottom: 2,
                  }}
                >
                  {cr.card}
                </h4>
                <p
                  style={{
                    fontFamily: 'EB Garamond, serif',
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: 'var(--brown-light)',
                  }}
                >
                  {cr.position}
                </p>
              </div>
              <div className="flex flex-wrap gap-1 justify-end max-w-[55%]">
                {cr.keywords.map((kw) => (
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
              </div>
            </div>
            <p
              style={{
                fontFamily: 'EB Garamond, serif',
                fontSize: 19,
                lineHeight: 1.7,
                color: 'var(--brown-mid)',
              }}
            >
              {cr.interpretation}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Synthesis */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{
          background: 'linear-gradient(135deg, var(--gold-pale) 0%, var(--cream-card) 100%)',
          border: '1px solid rgba(196,146,42,0.3)',
          borderRadius: 4,
          padding: 'clamp(16px, 4vw, 28px) clamp(16px, 5vw, 32px)',
          position: 'relative' as const,
        }}
      >
        {/* Decorative large ✦ top-right */}
        <span
          style={{
            position: 'absolute',
            top: 16,
            right: 20,
            fontSize: 40,
            color: 'rgba(196,146,42,0.15)',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          ✦
        </span>
        <p
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'var(--gold)',
            textTransform: 'uppercase' as const,
            marginBottom: 16,
          }}
        >
          What the Cards Say Together
        </p>
        <p
          style={{
            fontFamily: 'EB Garamond, serif',
            fontSize: 20,
            lineHeight: 1.7,
            color: 'var(--brown-dark)',
          }}
        >
          {reading.synthesis}
        </p>

        {/* Affirmation */}
        <div
          style={{
            borderTop: '1px solid rgba(196,146,42,0.2)',
            marginTop: 20,
            paddingTop: 20,
          }}
        >
          <p
            style={{
              fontFamily: 'Pinyon Script, cursive',
              fontSize: 'clamp(24px, 4vw, 32px)',
              color: 'var(--gold)',
              textAlign: 'center' as const,
              lineHeight: 1.3,
              textShadow: '0 0 30px rgba(196,146,42,0.25)',
            }}
          >
            &ldquo;{reading.affirmation}&rdquo;
          </p>
        </div>
      </motion.div>

      {/* Timing */}
      {reading.notableTiming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <p
            style={{
              fontFamily: 'EB Garamond, serif',
              fontSize: 16,
              fontStyle: 'italic',
              color: 'var(--brown-light)',
            }}
          >
            ☽ {reading.notableTiming}
          </p>
        </motion.div>
      )}
    </div>
  );
}
