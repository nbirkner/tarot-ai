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
    swatchColors: ['#1A0F2E', '#2E1065', '#C4922A'],
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
        <p
          style={{
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: 8,
            opacity: 0.7,
          }}
        >
          Standard Tarot
        </p>
        <div className="flex flex-col gap-2">
          {STANDARD_DECKS.map((deck) => {
            const isSelected = value === deck.style;
            return (
              <button
                key={deck.style}
                onClick={() => onChange(deck.style)}
                style={{
                  background: isSelected ? 'var(--gold-pale)' : 'var(--cream-card)',
                  border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border-gold)'}`,
                  borderRadius: 3,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  position: 'relative',
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
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 14,
                      right: 16,
                      color: 'var(--gold)',
                      fontSize: 10,
                      opacity: 0.8,
                    }}
                  >
                    ✦
                  </span>
                )}

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
                    <p
                      style={{
                        fontFamily: 'var(--font-cinzel), serif',
                        fontSize: 12,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: isSelected ? 'var(--brown-dark)' : 'var(--brown-mid)',
                        marginBottom: 5,
                        transition: 'color 0.2s ease',
                      }}
                    >
                      {deck.label}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-spectral), serif',
                        fontSize: 15,
                        fontStyle: 'italic',
                        color: 'var(--brown-light)',
                        marginBottom: 3,
                        lineHeight: 1.3,
                      }}
                    >
                      {deck.description}
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
      <div className="flex items-center gap-3" style={{ color: 'var(--gold)', opacity: 0.35 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
        <span style={{ fontSize: 9 }}>✦</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
      </div>

      {/* Osho Zen section */}
      <div>
        <p
          style={{
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'var(--sage, #7A8C6E)',
            textTransform: 'uppercase',
            marginBottom: 8,
            opacity: 0.8,
          }}
        >
          Osho Zen Tarot
        </p>
        <button
          onClick={() => onChange('osho-zen')}
          style={{
            width: '100%',
            background: isOshoSelected ? 'rgba(122,140,110,0.12)' : 'var(--cream-card)',
            border: `1px solid ${isOshoSelected ? 'var(--sage, #7A8C6E)' : 'var(--border-gold)'}`,
            borderRadius: 3,
            padding: '14px 18px',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            outline: 'none',
            position: 'relative',
          }}
          onMouseEnter={e => {
            if (!isOshoSelected) {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--sage, #7A8C6E)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(122,140,110,0.12)';
            }
          }}
          onMouseLeave={e => {
            if (!isOshoSelected) {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-gold)';
              (e.currentTarget as HTMLElement).style.boxShadow = 'none';
            }
          }}
        >
          {isOshoSelected && (
            <span
              style={{
                position: 'absolute',
                top: 14,
                right: 16,
                color: 'var(--sage, #7A8C6E)',
                fontSize: 10,
                opacity: 0.8,
              }}
            >
              ✦
            </span>
          )}

          <div className="flex items-center gap-5">
            {/* Zen color swatches */}
            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
              {['#4A6741', '#C4922A', '#8B5E3C', '#6B8E7A'].map((color, i) => (
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
              <p
                style={{
                  fontFamily: 'var(--font-cinzel), serif',
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isOshoSelected ? 'var(--brown-dark)' : 'var(--brown-mid)',
                  marginBottom: 5,
                  transition: 'color 0.2s ease',
                }}
              >
                Osho Zen
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-spectral), serif',
                  fontSize: 15,
                  fontStyle: 'italic',
                  color: 'var(--brown-light)',
                  marginBottom: 3,
                  lineHeight: 1.3,
                }}
              >
                79 cards, no reversals, pure awareness
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-spectral), serif',
                  fontSize: 12,
                  color: isOshoSelected ? 'var(--sage, #7A8C6E)' : 'var(--gold-muted)',
                  letterSpacing: '0.04em',
                  transition: 'color 0.2s ease',
                }}
              >
                Meditation as the mirror
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
