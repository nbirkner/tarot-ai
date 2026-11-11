'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ReadingResult } from '../lib/types';

interface ReadingDisplayProps {
  reading: ReadingResult;
}

export function ReadingDisplay({ reading }: ReadingDisplayProps) {
  const reduce = useReducedMotion();
  const enter = reduce ? { duration: 0 } : { duration: 0.45 };

  return (
    <div className="reading-result">
      <motion.section className="thought" initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
        <h2 className="thought-title">The Cards Have a Thought</h2>
        <p className="thought-lead">{reading.overallEnergy}</p>
      </motion.section>

      <ol className="card-readings">
        {reading.cardReadings.map((cr, i) => (
          <motion.li
            key={`${cr.card}-${cr.position}`}
            className="card-reading"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reduce ? { duration: 0 } : { delay: 0.08 * i, duration: 0.35 }}
          >
            <p className="mono-label">
              {String(i + 1).padStart(2, '0')} / {cr.position}
              {reading.cards[i]?.reversed ? ' / Reversed' : ''}
            </p>
            <h3>{cr.card}</h3>
            {cr.keywords.length > 0 && (
              <div className="keyword-row">
                {cr.keywords.map((kw) => (
                  <span key={kw} className="keyword">
                    {kw}
                  </span>
                ))}
              </div>
            )}
            <p className="body">{cr.interpretation}</p>
          </motion.li>
        ))}
      </ol>

      <motion.section
        className="thought"
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { delay: 0.2, duration: 0.45 }}
      >
        <h2 className="thought-title">What the Cards Say Together</h2>
        <p className="thought-lead">{reading.synthesis}</p>
        {reading.affirmation && <p className="affirmation">&ldquo;{reading.affirmation}&rdquo;</p>}
      </motion.section>

      {reading.notableTiming && <p className="timing">{reading.notableTiming}</p>}
    </div>
  );
}
