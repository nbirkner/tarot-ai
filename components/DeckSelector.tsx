'use client';

import { DeckStyle } from '../lib/types';

interface DeckDef {
  style: DeckStyle;
  label: string;
  description: string;
  mood: string;
}

const STANDARD_DECKS: DeckDef[] = [
  {
    style: 'dark-gothic',
    label: 'Dark Gothic',
    description: 'Atmospheric, mysterious, celestial',
    mood: 'Midnight ritual energy',
  },
  {
    style: 'ethereal',
    label: 'Ethereal',
    description: 'Soft glow, dreamy watercolors',
    mood: 'Spirit world softness',
  },
  {
    style: 'classic',
    label: 'Classic Reimagined',
    description: 'Traditional symbolism, elevated art',
    mood: 'Ancient wisdom',
  },
];

interface DeckSelectorProps {
  value: DeckStyle;
  onChange: (style: DeckStyle) => void;
}

function DeckRow({
  deck,
  selected,
  onChange,
}: {
  deck: DeckDef;
  selected: boolean;
  onChange: (style: DeckStyle) => void;
}) {
  return (
    <button
      type="button"
      className="deck-row"
      aria-pressed={selected}
      onClick={() => onChange(deck.style)}
    >
      <span className="deck-copy">
        <strong>{deck.label}</strong>
        <span className="fine">{deck.description}</span>
        <span className="mono-label">{deck.mood}</span>
      </span>
      <span className="radio" aria-hidden="true" />
    </button>
  );
}

export function DeckSelector({ value, onChange }: DeckSelectorProps) {
  return (
    <div>
      <p className="mono-label group-label">Standard Tarot</p>
      <div className="deck-list">
        {STANDARD_DECKS.map((deck) => (
          <DeckRow key={deck.style} deck={deck} selected={value === deck.style} onChange={onChange} />
        ))}
      </div>
      <p className="mono-label group-label">Osho Zen Tarot</p>
      <div className="deck-list">
        <DeckRow
          deck={{
            style: 'osho-zen',
            label: 'Osho Zen',
            description: '79 cards, no reversals, pure awareness',
            mood: 'Meditation as the mirror',
          }}
          selected={value === 'osho-zen'}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
