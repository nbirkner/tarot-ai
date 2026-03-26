'use client';

import { SPREADS } from '../lib/tarot';
import { SpreadType } from '../lib/types';

interface SpreadSelectorProps {
  value: SpreadType;
  onChange: (type: SpreadType) => void;
}

// Geometric card-count visualizations
function SpreadDots({ count, isSelected }: { count: number; isSelected: boolean }) {
  const size = 5;
  const gap = 4;
  const color = isSelected ? 'var(--gold)' : 'var(--gold-muted)';

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

export function SpreadSelector({ value, onChange }: SpreadSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {SPREADS.map((spread) => {
        const isSelected = value === spread.type;
        return (
          <button
            key={spread.type}
            onClick={() => onChange(spread.type)}
            style={{
              background: isSelected ? 'var(--gold-pale)' : 'var(--cream-card)',
              border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-gold)'}`,
              borderRadius: 3,
              padding: '16px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              position: 'relative',
              outline: 'none',
            }}
            onMouseEnter={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(196,146,42,0.1)';
              }
            }}
            onMouseLeave={e => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-gold)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }
            }}
          >
            {/* Selected checkmark */}
            {isSelected && (
              <span
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 14,
                  color: 'var(--gold)',
                  fontSize: 10,
                  opacity: 0.8,
                }}
              >
                ✦
              </span>
            )}

            <div style={{ marginBottom: 12 }}>
              <SpreadDots count={spread.cardCount} isSelected={isSelected} />
            </div>

            <p
              style={{
                fontFamily: 'var(--font-cinzel), serif',
                fontSize: 12,
                letterSpacing: '0.1em',
                color: isSelected ? 'var(--brown-dark)' : 'var(--brown-mid)',
                marginBottom: 5,
                transition: 'color 0.2s ease',
                textTransform: 'uppercase',
              }}
            >
              {spread.label}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-spectral), serif',
                fontSize: 14,
                fontStyle: 'italic',
                color: 'var(--brown-light)',
                lineHeight: 1.35,
                marginBottom: 6,
              }}
            >
              {spread.description}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-spectral), serif',
                fontSize: 12,
                color: isSelected ? 'var(--gold)' : 'var(--gold-muted)',
                letterSpacing: '0.04em',
                transition: 'color 0.2s ease',
              }}
            >
              {spread.cardCount} card{spread.cardCount > 1 ? 's' : ''}
            </p>
          </button>
        );
      })}
    </div>
  );
}
