'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDFAF6" />
          <stop offset="100%" stopColor="#F5EDD8" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="200" height="300" fill="url(#bgGrad)" rx="6" />

      {/* Outer gold border */}
      <rect x="5" y="5" width="190" height="290" fill="none" stroke="#C4922A" strokeWidth="1.2" rx="5" opacity="0.6" />
      <rect x="9" y="9" width="182" height="282" fill="none" stroke="#C4922A" strokeWidth="0.5" rx="4" opacity="0.3" strokeDasharray="4 3" />

      {/* Corner flourishes */}
      {[
        [20, 20], [180, 20], [20, 280], [180, 280]
      ].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx}, ${cy})`} opacity="0.75">
          <circle cx="0" cy="0" r="7" fill="none" stroke="#C4922A" strokeWidth="0.9" />
          <circle cx="0" cy="0" r="2" fill="#C4922A" />
          <line x1="-11" y1="0" x2="11" y2="0" stroke="#C4922A" strokeWidth="0.6" opacity="0.5" />
          <line x1="0" y1="-11" x2="0" y2="11" stroke="#C4922A" strokeWidth="0.6" opacity="0.5" />
        </g>
      ))}

      {/* Central celestial ring */}
      <circle cx="100" cy="150" r="58" fill="none" stroke="#C4922A" strokeWidth="0.8" opacity="0.25" />
      <circle cx="100" cy="150" r="50" fill="none" stroke="#C4922A" strokeWidth="0.5" opacity="0.2" strokeDasharray="3 4" />

      {/* Crescent moon */}
      <path
        d="M100 102 Q128 122 128 150 Q128 178 100 198 Q140 190 144 150 Q144 110 100 102Z"
        fill="#C4922A"
        opacity="0.12"
      />
      <path
        d="M100 106 Q125 126 125 150 Q125 174 100 194 Q137 186 141 150 Q141 114 100 106Z"
        fill="none"
        stroke="#C4922A"
        strokeWidth="1"
        opacity="0.45"
      />

      {/* Stars around the ring */}
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        const x = 100 + 62 * Math.cos(rad);
        const y = 150 + 62 * Math.sin(rad);
        const size = i % 3 === 0 ? 5 : 3;
        return (
          <g key={i} transform={`translate(${x}, ${y})`} opacity={i % 2 === 0 ? 0.7 : 0.45}>
            <line x1={`-${size}`} y1="0" x2={size} y2="0" stroke="#C4922A" strokeWidth="0.8" />
            <line x1="0" y1={`-${size}`} x2="0" y2={size} stroke="#C4922A" strokeWidth="0.8" />
          </g>
        );
      })}

      {/* Top botanical sprigs */}
      <g opacity="0.38" transform="translate(100, 48)">
        <path d="M0 0 C-18-16-32-8-38 4" fill="none" stroke="#4A7A65" strokeWidth="1.3" />
        <path d="M0 0 C18-16 32-8 38 4" fill="none" stroke="#4A7A65" strokeWidth="1.3" />
        <path d="M0 0 C-6-28 0-42 0-48" fill="none" stroke="#4A7A65" strokeWidth="1" />
        <ellipse cx="-38" cy="4" rx="9" ry="5" fill="#4A7A65" transform="rotate(-25 -38 4)" />
        <ellipse cx="38" cy="4" rx="9" ry="5" fill="#4A7A65" transform="rotate(25 38 4)" />
        <ellipse cx="0" cy="-48" rx="5" ry="8" fill="#4A7A65" />
        <circle cx="-22" cy="-12" r="3" fill="#B5706E" opacity="0.6" />
        <circle cx="22" cy="-12" r="3" fill="#B5706E" opacity="0.6" />
      </g>

      {/* Bottom botanical sprigs (mirrored) */}
      <g opacity="0.38" transform="translate(100, 252) scale(1, -1)">
        <path d="M0 0 C-18-16-32-8-38 4" fill="none" stroke="#4A7A65" strokeWidth="1.3" />
        <path d="M0 0 C18-16 32-8 38 4" fill="none" stroke="#4A7A65" strokeWidth="1.3" />
        <path d="M0 0 C-6-28 0-42 0-48" fill="none" stroke="#4A7A65" strokeWidth="1" />
        <ellipse cx="-38" cy="4" rx="9" ry="5" fill="#4A7A65" transform="rotate(-25 -38 4)" />
        <ellipse cx="38" cy="4" rx="9" ry="5" fill="#4A7A65" transform="rotate(25 38 4)" />
        <ellipse cx="0" cy="-48" rx="5" ry="8" fill="#4A7A65" />
        <circle cx="-22" cy="-12" r="3" fill="#B5706E" opacity="0.6" />
        <circle cx="22" cy="-12" r="3" fill="#B5706E" opacity="0.6" />
      </g>

      {/* TAROT text top */}
      <text
        x="100" y="34"
        textAnchor="middle"
        fontFamily="Cinzel, Georgia, serif"
        fontSize="7"
        fill="#C4922A"
        opacity="0.65"
        letterSpacing="4"
      >
        TAROT · AI
      </text>

      {/* Stars bottom */}
      <text
        x="100" y="275"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="9"
        fill="#C4922A"
        opacity="0.5"
        letterSpacing="6"
      >
        ✦ ✦ ✦
      </text>
    </svg>
  );
}

export function TarotCard({ drawn, isFlipped, isFlippable, isRevealed, isLoading, onClick, size = 'md', showPosition = true }: TarotCardProps) {
  const { width, height } = SIZES[size];

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{
          width: `min(${width}px, 42vw)`,
          height: `min(${height}px, 63vw)`,
          perspective: 1200,
        }}
        onClick={isFlippable && !isFlipped ? onClick : undefined}
        className={isFlippable && !isFlipped ? 'cursor-pointer' : ''}
      >
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
