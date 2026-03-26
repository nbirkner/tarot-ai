'use client';

import { SPREADS } from '../lib/tarot';
import { SpreadType } from '../lib/types';

interface SpreadSelectorProps {
  value: SpreadType;
  onChange: (type: SpreadType) => void;
}

const SPREAD_ICONS: Record<SpreadType, string> = {
  single: '✦',
  three: '✦ ✦ ✦',
  five: '✦ ✦ ✦ ✦ ✦',
  celtic: '⊕',
};

export function SpreadSelector({ value, onChange }: SpreadSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SPREADS.map((spread) => (
        <button
          key={spread.type}
          onClick={() => onChange(spread.type)}
          className={`select-card ${value === spread.type ? 'selected' : ''}`}
        >
          <div className="flex items-start gap-3">
            <span style={{ color: 'var(--gold)', fontSize: 14, letterSpacing: '0.15em', minWidth: 60, paddingTop: 2 }}>
              {SPREAD_ICONS[spread.type]}
            </span>
            <div>
              <p
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 13,
                  letterSpacing: '0.08em',
                  color: value === spread.type ? 'var(--brown-dark)' : 'var(--brown-mid)',
                  marginBottom: 4,
                }}
              >
                {spread.label}
              </p>
              <p
                style={{
                  fontFamily: 'EB Garamond, serif',
                  fontSize: 15,
                  fontStyle: 'italic',
                  color: 'var(--brown-light)',
                  lineHeight: 1.3,
                }}
              >
                {spread.description}
              </p>
              <p
                style={{
                  fontFamily: 'EB Garamond, serif',
                  fontSize: 13,
                  color: 'var(--gold)',
                  marginTop: 4,
                }}
              >
                {spread.cardCount} card{spread.cardCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
