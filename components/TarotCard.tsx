'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { DrawnCard } from '../lib/types';

interface TarotCardProps {
  drawn: DrawnCard;
  isFlipped?: boolean;
  isFlippable?: boolean;
  isRevealed?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showPosition?: boolean;
}

const SIZES = {
  sm:   { width: 90,  height: 135 },
  md:   { width: 130, height: 195 },
  lg:   { width: 180, height: 270 },
  hero: { width: 260, height: 390 },
};

function CardBackSVG() {
  return (
    <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="cbBg" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#FDFAF6" />
          <stop offset="60%" stopColor="#F8F1E4" />
          <stop offset="100%" stopColor="#F0E6D0" />
        </radialGradient>
        <pattern id="dotGrid" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="0.7" fill="#C4922A" opacity="0.06" />
        </pattern>
      </defs>

      {/* Parchment background */}
      <rect width="200" height="300" fill="url(#cbBg)" rx="6" />

      {/* Dot grid texture */}
      <rect width="200" height="300" fill="url(#dotGrid)" rx="6" />

      {/* Outer double-line border */}
      <rect x="5" y="5" width="190" height="290" fill="none" stroke="#C4922A" strokeWidth="2" rx="4" opacity="0.55" />
      <rect x="11" y="11" width="178" height="278" fill="none" stroke="#C4922A" strokeWidth="1" rx="4" opacity="0.35" />

      {/* Corner ornaments — botanical flourish with rose petals */}
      {([
        [22, 22, 0],
        [178, 22, 90],
        [178, 278, 180],
        [22, 278, 270],
      ] as [number, number, number][]).map(([cx, cy, rot], i) => (
        <g key={i} transform={`translate(${cx},${cy}) rotate(${rot})`} opacity="0.7">
          {/* Radiating petals */}
          <ellipse cx="0" cy="-8" rx="2.5" ry="5" fill="#C4922A" opacity="0.55" transform="rotate(0)" />
          <ellipse cx="0" cy="-8" rx="2.5" ry="5" fill="#C4922A" opacity="0.45" transform="rotate(45)" />
          <ellipse cx="0" cy="-8" rx="2.5" ry="5" fill="#C4922A" opacity="0.45" transform="rotate(90)" />
          <ellipse cx="0" cy="-8" rx="2.5" ry="5" fill="#C4922A" opacity="0.35" transform="rotate(135)" />
          {/* Rose center */}
          <circle cx="0" cy="0" r="3.5" fill="#B5706E" opacity="0.6" />
          <circle cx="0" cy="0" r="1.8" fill="#C4922A" opacity="0.8" />
          {/* Tiny leaves extending outward */}
          <path d="M4 0 C8 -3 12 -1 14 2 C11 0 8 2 4 0Z" fill="#4A7A65" opacity="0.45" />
          <path d="M0 4 C-3 8 -1 12 2 14 C0 11 2 8 0 4Z" fill="#4A7A65" opacity="0.45" />
        </g>
      ))}

      {/* Central mandala outer ring — 12 diamonds */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180);
        const r = 64;
        const x = 100 + r * Math.cos(angle);
        const y = 150 + r * Math.sin(angle);
        return (
          <polygon
            key={i}
            points={`${x},${y - 4} ${x + 3},${y} ${x},${y + 4} ${x - 3},${y}`}
            fill="#C4922A"
            opacity={i % 3 === 0 ? 0.7 : 0.4}
          />
        );
      })}

      {/* Outer ring circle guide */}
      <circle cx="100" cy="150" r="64" fill="none" stroke="#C4922A" strokeWidth="0.4" opacity="0.18" />

      {/* Middle ring — 8 curved lotus petals */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * 45) * (Math.PI / 180);
        const px = 100 + 42 * Math.cos(angle);
        const py = 150 + 42 * Math.sin(angle);
        const c1x = 100 + 52 * Math.cos(angle - 0.35);
        const c1y = 150 + 52 * Math.sin(angle - 0.35);
        const c2x = 100 + 52 * Math.cos(angle + 0.35);
        const c2y = 150 + 52 * Math.sin(angle + 0.35);
        return (
          <path
            key={i}
            d={`M100,150 C${c1x},${c1y} ${px},${py} ${px},${py} C${px},${py} ${c2x},${c2y} 100,150`}
            fill="#C4922A"
            opacity="0.13"
            stroke="#C4922A"
            strokeWidth="0.6"
            strokeOpacity="0.35"
          />
        );
      })}

      {/* Inner mandala ring */}
      <circle cx="100" cy="150" r="28" fill="none" stroke="#C4922A" strokeWidth="0.8" opacity="0.3" />
      <circle cx="100" cy="150" r="20" fill="none" stroke="#B5706E" strokeWidth="0.6" opacity="0.25" />

      {/* Crescent moon in center */}
      <path
        d="M100 130 Q115 138 115 150 Q115 162 100 170 Q120 167 123 150 Q123 133 100 130Z"
        fill="#C4922A"
        opacity="0.35"
      />
      <path
        d="M100 132 Q113 140 113 150 Q113 160 100 168 Q118 165 121 150 Q121 135 100 132Z"
        fill="none"
        stroke="#C4922A"
        strokeWidth="0.8"
        opacity="0.55"
      />

      {/* 5-pointed star emerging from moon tips */}
      <polygon
        points="88,133 90,139 96,139 91,143 93,149 88,145 83,149 85,143 80,139 86,139"
        fill="#C4922A"
        opacity="0.45"
        transform="scale(0.85) translate(14,17)"
      />

      {/* Top ornamental line — leaf/dot pattern */}
      <g opacity="0.35" transform="translate(100, 30)">
        {[-36, -24, -12, 0, 12, 24, 36].map((x, j) => (
          <g key={j} transform={`translate(${x}, 0)`}>
            {j % 2 === 0 ? (
              <ellipse cx="0" cy="0" rx="3" ry="4.5" fill="#4A7A65" opacity="0.7" />
            ) : (
              <circle cx="0" cy="0" r="1.5" fill="#C4922A" opacity="0.8" />
            )}
          </g>
        ))}
      </g>

      {/* Bottom ornamental line — mirrored */}
      <g opacity="0.35" transform="translate(100, 270)">
        {[-36, -24, -12, 0, 12, 24, 36].map((x, j) => (
          <g key={j} transform={`translate(${x}, 0)`}>
            {j % 2 === 0 ? (
              <ellipse cx="0" cy="0" rx="3" ry="4.5" fill="#4A7A65" opacity="0.7" />
            ) : (
              <circle cx="0" cy="0" r="1.5" fill="#C4922A" opacity="0.8" />
            )}
          </g>
        ))}
      </g>

      {/* TAROT · AI label */}
      <text
        x="100" y="20"
        textAnchor="middle"
        fontFamily="Cinzel, Georgia, serif"
        fontSize="6"
        fill="#C4922A"
        opacity="0.6"
        letterSpacing="5"
      >
        TAROT · AI
      </text>

      {/* Decorative stars bottom */}
      <text
        x="100" y="288"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="8"
        fill="#C4922A"
        opacity="0.5"
        letterSpacing="7"
      >
        ✦ ✦ ✦
      </text>

      {/* Side line accents */}
      <line x1="17" y1="80" x2="17" y2="220" stroke="#C4922A" strokeWidth="0.5" opacity="0.18" />
      <line x1="183" y1="80" x2="183" y2="220" stroke="#C4922A" strokeWidth="0.5" opacity="0.18" />

      {/* Small diamond accents along sides */}
      {[110, 140, 170].map((y, i) => (
        <g key={i}>
          <polygon points={`17,${y - 4} 20,${y} 17,${y + 4} 14,${y}`} fill="#C4922A" opacity="0.3" />
          <polygon points={`183,${y - 4} 186,${y} 183,${y + 4} 180,${y}`} fill="#C4922A" opacity="0.3" />
        </g>
      ))}
    </svg>
  );
}

// Sparkle positions: [top%, left%, size]
const SPARKLE_POSITIONS: [string, string, number][] = [
  ['-8%', '10%',  3],
  ['-8%', '80%',  4],
  ['20%', '-10%', 3],
  ['20%', '105%', 4],
  ['85%', '5%',   3],
  ['85%', '88%',  3],
];

export function TarotCard({ drawn, isFlipped, isFlippable, isRevealed, isLoading, onClick, size = 'md', showPosition = true }: TarotCardProps) {
  const { width, height } = SIZES[size];
  const [showSparkle, setShowSparkle] = useState(false);

  useEffect(() => {
    if (isFlipped) {
      setShowSparkle(true);
      const t = setTimeout(() => setShowSparkle(false), 1000);
      return () => clearTimeout(t);
    }
  }, [isFlipped]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{
          width: `min(${width}px, 42vw)`,
          height: `min(${height}px, 63vw)`,
          perspective: 1200,
          position: 'relative',
        }}
        onClick={isFlippable && !isFlipped ? onClick : undefined}
        className={isFlippable && !isFlipped ? 'cursor-pointer' : ''}
      >
        {/* Sparkle burst on flip */}
        {showSparkle && SPARKLE_POSITIONS.map(([top, left, sz], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top,
              left,
              width: sz,
              height: sz,
              borderRadius: '50%',
              background: '#C4922A',
              animation: 'drift-up 1s ease-out forwards',
              animationDelay: `${i * 0.07}s`,
              pointerEvents: 'none',
              zIndex: 20,
            }}
          />
        ))}

        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* CARD BACK — face down (shown first) */}
          <div
            className={`absolute inset-0 rounded-lg overflow-hidden shadow-lg transition-shadow duration-500 ${
              isFlippable && !isFlipped ? 'card-glow shadow-[0_0_30px_rgba(196,146,42,0.2)]' : 'shadow-[0_4px_20px_rgba(42,31,20,0.12)]'
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardBackSVG />
          </div>

          {/* CARD FRONT — revealed on flip (the AI art) */}
          <div
            className="absolute inset-0 rounded-lg overflow-hidden shadow-lg border border-[rgba(196,146,42,0.3)]"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            {drawn.imageUrl ? (
              <div className={`w-full h-full ${drawn.reversed ? 'rotate-180' : ''}`}>
                <Image
                  src={drawn.imageUrl}
                  alt={drawn.card.name}
                  width={width * 2}
                  height={height * 2}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-[#F5EDD8] flex items-center justify-center">
                <span
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    color: '#7A5C45',
                    fontSize: 12,
                    textAlign: 'center',
                    padding: '0 8px',
                  }}
                >
                  {drawn.card.name}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Card label — shows after flip */}
      <AnimatePresence>
        {isFlipped && showPosition && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-center"
          >
            <p
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 11,
                letterSpacing: '0.1em',
                color: '#2A1F14',
              }}
            >
              {drawn.card.name}
            </p>
            {drawn.reversed && (
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 12, color: '#B5706E', fontStyle: 'italic' }}>
                reversed
              </p>
            )}
            {drawn.position && (
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 13, color: '#A88C78', fontStyle: 'italic' }}>
                {drawn.position}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* "tap to reveal" hint on flippable unflipped cards */}
      <AnimatePresence>
        {isFlippable && !isFlipped && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 13,
              color: '#C4922A',
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            tap to reveal
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
