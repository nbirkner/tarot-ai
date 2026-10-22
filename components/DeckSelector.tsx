'use client';

import { DeckStyle } from '../lib/types';

interface DeckDef {
  style: DeckStyle;
  label: string;
  description: string;
  swatchColors: string[];
  mood: string;
}

const STANDARD_DECKS: DeckDef[] = [
  {
    style: 'dark-gothic',
    label: 'Dark Gothic',
    description: 'Atmospheric, mysterious, celestial',
    swatchColors: ['#1A0F2E', '#2E1065', 'var(--accent)'],
    mood: 'Midnight ritual energy',
  },
  {
    style: 'ethereal',
    label: 'Ethereal',
    description: 'Soft glow, dreamy watercolors',
    swatchColors: ['#E8D5F5', '#C4B5E8', '#F9E8FF'],
    mood: 'Spirit world softness',
  },
  {
    style: 'classic',
    label: 'Classic Reimagined',
    description: 'Traditional symbolism, elevated art',
    swatchColors: ['#8B4513', '#D4A843', '#2C4A3E'],
    mood: 'Ancient wisdom',
  },
];

interface DeckSelectorProps {
  value: DeckStyle;
  onChange: (style: DeckStyle) => void;
}

export function DeckSelector({ value, onChange }: DeckSelectorProps) {
  const isOshoSelected = value === 'osho-zen';

  return (
    <div className="flex flex-col gap-4">
      {/* Standard Tarot section */}
      <div>
        <p className="label" style={{ marginBottom: 12 }}>
          Standard Tarot
        </p>
        <div className="flex flex-col gap-2">
          {STANDARD_DECKS.map((deck) => {
            const isSelected = value === deck.style;
            return (
              <button
                key={deck.style}
                type="button"
                onClick={() => onChange(deck.style)}
                className={`select-card${isSelected ? ' selected' : ''}`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-5">
                  <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                    {deck.swatchColors.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          width: 12,
                          height: 52,
                          background: color,
                          borderRadius: 1,
                          border: '1px solid rgba(0,0,0,0.1)',
                          opacity: isSelected ? 1 : 0.8,
                          transition: 'opacity 0.2s ease',
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 4, color: 'var(--fg)' }}>
                      {deck.label}
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4, lineHeight: 1.5 }}>
                      {deck.description}
                    </p>
                    <p className="label" style={{ margin: 0 }}>
                      {deck.mood}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <hr className="rule" />

      {/* Osho Zen section */}
      <div>
        <p className="label" style={{ marginBottom: 12 }}>
          Osho Zen Tarot
        </p>
        <button
          type="button"
          onClick={() => onChange('osho-zen')}
          className={`select-card${isOshoSelected ? ' selected' : ''}`}
          aria-pressed={isOshoSelected}
          style={{ width: '100%' }}
        >
          <div className="flex items-center gap-5">
            {/* Zen color swatches */}
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {['#4A6741', 'var(--accent)', '#8B5E3C', '#6B8E7A'].map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: 52,
                    background: color,
                    borderRadius: 1,
                    border: '1px solid rgba(0,0,0,0.1)',
                    opacity: isOshoSelected ? 1 : 0.8,
                    transition: 'opacity 0.2s ease',
                  }}
                />
              ))}
            </div>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, marginBottom: 4, color: 'var(--fg)' }}>
                Osho Zen
              </p>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 4, lineHeight: 1.5 }}>
                79 cards, no reversals, pure awareness
              </p>
              <p className="label" style={{ margin: 0 }}>
                Meditation as the mirror
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
