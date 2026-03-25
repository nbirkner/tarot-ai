'use client';

import { motion } from 'framer-motion';
import { ReadingResult } from '../lib/types';
import { TarotCard } from './TarotCard';

interface ReadingDisplayProps {
  reading: ReadingResult;
}

export function ReadingDisplay({ reading }: ReadingDisplayProps) {
  return (
    <div className="space-y-8">
      {/* Cards row */}
      <div className="flex flex-wrap gap-4 justify-center">
        {reading.cards.map((drawn, i) => (
          <TarotCard key={i} drawn={drawn} isRevealed={true} isLoading={false} size="md" />
        ))}
      </div>

      {/* Overall energy */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-purple-950/40 border border-purple-800/30 rounded-xl p-5"
      >
        <h3 className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-2">Overall Energy</h3>
        <p className="text-purple-100 leading-relaxed">{reading.overallEnergy}</p>
      </motion.div>

      {/* Per-card readings */}
      <div className="space-y-4">
        {reading.cardReadings.map((cr, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="border border-purple-900/40 rounded-xl p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-purple-200 font-semibold">{cr.card}</h4>
                <p className="text-purple-500 text-xs">{cr.position}</p>
              </div>
              <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                {cr.keywords.map((kw) => (
                  <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-800/40">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-purple-200/80 text-sm leading-relaxed">{cr.interpretation}</p>
          </motion.div>
        ))}
      </div>

      {/* Synthesis */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-br from-purple-900/30 to-indigo-950/30 border border-purple-700/40 rounded-xl p-6 space-y-4"
      >
        <h3 className="text-purple-300 text-xs font-semibold uppercase tracking-widest">The Reading</h3>
        <p className="text-purple-100 leading-relaxed">{reading.synthesis}</p>
        <div className="border-t border-purple-800/30 pt-4">
          <p className="text-purple-300 text-sm italic">"{reading.affirmation}"</p>
        </div>
      </motion.div>

      {/* Timing */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center"
      >
        <p className="text-purple-500 text-xs">{reading.notableTiming}</p>
      </motion.div>
    </div>
  );
}
