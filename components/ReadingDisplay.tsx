'use client';

import { motion } from 'framer-motion';
import { ReadingResult } from '../lib/types';

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
        <p
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'var(--gold)',
            textTransform: 'uppercase' as const,
            marginBottom: 12,
          }}
        >
          The Energy of This Reading
        </p>
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 20,
            lineHeight: 1.6,
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
              borderRadius: 4,
              padding: 'clamp(14px, 3.5vw, 22px) clamp(14px, 4.5vw, 28px)',
            }}
          >
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
                    fontFamily: 'Cormorant Garamond, serif',
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
                      fontFamily: 'Cormorant Garamond, serif',
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
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 18,
                lineHeight: 1.65,
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
          The Full Reading
        </p>
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
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
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 22,
              fontStyle: 'italic',
              color: 'var(--gold)',
              textAlign: 'center' as const,
              lineHeight: 1.4,
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
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 15,
              fontStyle: 'italic',
              color: 'var(--brown-light)',
            }}
          >
            {reading.notableTiming}
          </p>
        </motion.div>
      )}
    </div>
  );
}
