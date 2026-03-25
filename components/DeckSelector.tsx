'use client';

import { DeckStyle } from '../lib/types';

interface DeckDef {
  style: DeckStyle;
  label: string;
  description: string;
  swatchColors: string[];
  mood: string;
}

const DECKS: DeckDef[] = [
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
  return (
    <div className="flex flex-col gap-3">
      {DECKS.map((deck) => (
        <button
          key={deck.style}
          onClick={() => onChange(deck.style)}
          className={`select-card ${value === deck.style ? 'selected' : ''}`}
        >
          <div className="flex items-center gap-4">
            {/* Color swatches */}
            <div className="flex gap-1 flex-shrink-0">
              {deck.swatchColors.map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: 16,
                    height: 56,
                    background: color,
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.08)',
                  }}
                />
              ))}
            </div>
            <div className="text-left">
              <p
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 13,
                  letterSpacing: '0.08em',
                  color: value === deck.style ? 'var(--brown-dark)' : 'var(--brown-mid)',
                  marginBottom: 4,
                }}
              >
                {deck.label}
              </p>
              <p
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 15,
                  fontStyle: 'italic',
                  color: 'var(--brown-light)',
                  marginBottom: 2,
                }}
              >
                {deck.description}
              </p>
              <p
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 13,
                  color: 'var(--gold)',
                }}
              >
                {deck.mood}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
