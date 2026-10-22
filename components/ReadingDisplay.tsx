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
    <div className="stack">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="model"
      >
        <p className="label">The Energy of This Reading</p>
        <p className="body">{reading.overallEnergy}</p>
      </motion.div>

      <div className="stack">
        {reading.cardReadings.map((cr, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.1, duration: 0.4 }}
            className="model"
          >
            <p className="label">{toRoman(i + 1)} · {cr.position}</p>
            <h2>{cr.card}</h2>
            <div className="flex flex-wrap gap-2" style={{ marginTop: 10 }}>
              {cr.keywords.map((kw) => (
                <span key={kw} className="label" style={{ margin: 0 }}>
                  {kw}
                </span>
              ))}
            </div>
            <p className="body">{cr.interpretation}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="model"
      >
        <p className="label">What the Cards Say Together</p>
        <p className="body">{reading.synthesis}</p>
        <blockquote className="quote" style={{ marginTop: 20 }}>
          <p>&ldquo;{reading.affirmation}&rdquo;</p>
        </blockquote>
      </motion.div>

      {reading.notableTiming && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="label"
        >
          {reading.notableTiming}
        </motion.p>
      )}
    </div>
  );
}
