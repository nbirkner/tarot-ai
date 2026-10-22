'use client';

import { SPREADS } from '../lib/tarot';
import { SpreadType } from '../lib/types';

interface SpreadSelectorProps {
  value: SpreadType;
  onChange: (type: SpreadType) => void;
  deckType?: 'rider-waite' | 'osho-zen';
}

// Geometric card-count visualizations
function SpreadDots({ count, isSelected }: { count: number; isSelected: boolean }) {
  const size = 5;
  const gap = 4;
  const color = isSelected ? 'var(--accent)' : 'var(--muted)';

  if (count === 10) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: gap }}>
          {[0,1,2].map(i => <div key={i} style={{ width: size, height: size, borderRadius: '50%', background: color, opacity: isSelected ? 0.9 : 0.5 }} />)}
        </div>
        <div style={{ display: 'flex', gap: gap }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width: size, height: size, borderRadius: '50%', background: color, opacity: isSelected ? 0.9 : 0.5 }} />)}
        </div>
        <div style={{ display: 'flex', gap: gap }}>
          {[0,1,2].map(i => <div key={i} style={{ width: size, height: size, borderRadius: '50%', background: color, opacity: isSelected ? 0.9 : 0.5 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: gap, alignItems: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            opacity: isSelected ? 0.9 : 0.5,
            transition: 'all 0.2s ease',
          }}
        />
      ))}
    </div>
  );
}

export function SpreadSelector({ value, onChange, deckType = 'rider-waite' }: SpreadSelectorProps) {
  const visibleSpreads = SPREADS.filter((s) => s.deck === deckType);
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {visibleSpreads.map((spread) => {
        const isSelected = value === spread.type;
        return (
          <button
            key={spread.type}
            type="button"
            onClick={() => onChange(spread.type)}
            className={`select-card${isSelected ? ' selected' : ''}`}
            aria-pressed={isSelected}
          >
            <div style={{ marginBottom: 12 }}>
              <SpreadDots count={spread.cardCount} isSelected={isSelected} />
            </div>

            <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 4, color: 'var(--fg)' }}>
              {spread.label}
            </p>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 6 }}>
              {spread.description}
            </p>
            <p className="label" style={{ margin: 0 }}>
              {spread.cardCount} card{spread.cardCount > 1 ? 's' : ''}
            </p>
          </button>
        );
      })}
    </div>
  );
}
