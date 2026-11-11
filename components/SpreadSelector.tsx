'use client';

import { SPREADS } from '../lib/tarot';
import { SpreadType } from '../lib/types';

interface SpreadSelectorProps {
  value: SpreadType;
  onChange: (type: SpreadType) => void;
  deckType?: 'rider-waite' | 'osho-zen';
}

function SpreadMark({ count }: { count: number }) {
  const rects =
    count === 1
      ? [{ x: 28, y: 8, w: 12, h: 26 }]
      : count === 3
        ? [0, 1, 2].map((i) => ({ x: 10 + i * 16, y: 8, w: 12, h: 26 }))
        : count === 5
          ? [
              { x: 28, y: 2, w: 10, h: 16 },
              { x: 12, y: 14, w: 10, h: 16 },
              { x: 28, y: 14, w: 10, h: 16 },
              { x: 44, y: 14, w: 10, h: 16 },
              { x: 28, y: 26, w: 10, h: 12 },
            ]
          : count === 7
            ? [0, 1, 2, 3, 4, 5, 6].map((i) => ({
                x: 4 + i * 9,
                y: 18 - Math.abs(i - 3) * 3,
                w: 7,
                h: 16,
              }))
            : [
                { x: 30, y: 2, w: 8, h: 12 },
                { x: 18, y: 14, w: 8, h: 12 },
                { x: 30, y: 14, w: 8, h: 12 },
                { x: 42, y: 14, w: 8, h: 12 },
                { x: 4, y: 4, w: 7, h: 11 },
                { x: 4, y: 16, w: 7, h: 11 },
                { x: 4, y: 28, w: 7, h: 11 },
                { x: 54, y: 6, w: 7, h: 10 },
                { x: 54, y: 18, w: 7, h: 10 },
                { x: 54, y: 30, w: 7, h: 10 },
              ];

  return (
    <svg className="spread-mark" viewBox="0 0 68 44" aria-hidden="true">
      {rects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      ))}
    </svg>
  );
}

export function SpreadSelector({ value, onChange, deckType = 'rider-waite' }: SpreadSelectorProps) {
  const visibleSpreads = SPREADS.filter((s) => s.deck === deckType);
  return (
    <div className="spread-grid">
      {visibleSpreads.map((spread) => {
        const selected = value === spread.type;
        return (
          <button
            key={spread.type}
            type="button"
            className="spread-tile"
            aria-pressed={selected}
            onClick={() => onChange(spread.type)}
          >
            <SpreadMark count={spread.cardCount} />
            <strong>{spread.label}</strong>
            <span className="fine">{spread.description}</span>
            <span className="mono-label">
              {spread.cardCount} {spread.cardCount === 1 ? 'Card' : 'Cards'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
