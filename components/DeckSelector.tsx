'use client';

import { DeckStyle } from '../lib/types';

interface DeckDef {
  style: DeckStyle;
  label: string;
  description: string;
  colorClass: string;
}

const DECKS: DeckDef[] = [
  {
    style: 'dark-gothic',
    label: 'Dark Gothic',
    description: 'Deep purples, blacks, gold — atmospheric and mysterious',
    colorClass: 'from-purple-950 to-slate-900',
  },
  {
    style: 'ethereal',
    label: 'Ethereal',
    description: 'Soft glow, dreamy watercolors — spiritual not spooky',
    colorClass: 'from-indigo-200 to-purple-100',
  },
  {
    style: 'classic',
    label: 'Classic Reimagined',
    description: 'Traditional Rider-Waite symbolism, elevated illustration',
    colorClass: 'from-amber-700 to-amber-950',
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
          className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
            value === deck.style
              ? 'border-purple-500 bg-purple-950/60'
              : 'border-purple-900/50 bg-slate-900/50 hover:border-purple-700'
          }`}
        >
          <div className={`w-10 h-14 rounded bg-gradient-to-b ${deck.colorClass} border border-purple-800/40 flex-shrink-0`} />
          <div>
            <div className={`font-semibold text-sm ${value === deck.style ? 'text-purple-100' : 'text-purple-400'}`}>
              {deck.label}
            </div>
            <div className="text-xs text-purple-500 mt-0.5">{deck.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
