'use client';

import { motion } from 'framer-motion';
import { DrawnCard } from '../lib/types';
import Image from 'next/image';

interface TarotCardProps {
  drawn: DrawnCard;
  isRevealed: boolean;
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { width: 80, height: 120 },
  md: { width: 120, height: 180 },
  lg: { width: 180, height: 270 },
};

export function TarotCard({ drawn, isRevealed, isLoading, size = 'md' }: TarotCardProps) {
  const { width, height } = SIZES[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width, height, perspective: 1000 }}>
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Card back */}
          <div
            className="absolute inset-0 rounded-lg border border-purple-800 bg-gradient-to-br from-purple-950 to-slate-900 flex items-center justify-center overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-purple-900/30 animate-pulse" />
            )}
            <div className="text-purple-400 text-4xl opacity-30">✦</div>
          </div>

          {/* Card front */}
          <div
            className="absolute inset-0 rounded-lg overflow-hidden border border-purple-700"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {drawn.imageUrl ? (
              <div className={drawn.reversed ? 'rotate-180 w-full h-full' : 'w-full h-full'}>
                <Image
                  src={drawn.imageUrl}
                  alt={drawn.card.name}
                  width={width}
                  height={height}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-purple-950 flex items-center justify-center">
                <span className="text-purple-300 text-xs text-center px-2">{drawn.card.name}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {isRevealed && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <p className="text-purple-200 text-xs font-medium">{drawn.card.name}</p>
          {drawn.reversed && <p className="text-purple-400 text-xs">reversed</p>}
          <p className="text-purple-500 text-xs">{drawn.position}</p>
        </motion.div>
      )}
    </div>
  );
}
