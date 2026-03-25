'use client';

import { SPREADS } from '../lib/tarot';
import { SpreadType } from '../lib/types';

interface SpreadSelectorProps {
  value: SpreadType;
  onChange: (type: SpreadType) => void;
}

export function SpreadSelector({ value, onChange }: SpreadSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {SPREADS.map((spread) => (
        <button
          key={spread.type}
          onClick={() => onChange(spread.type)}
          className={`p-4 rounded-lg border text-left transition-all ${
            value === spread.type
              ? 'border-purple-500 bg-purple-950/60 text-purple-100'
              : 'border-purple-900/50 bg-slate-900/50 text-purple-400 hover:border-purple-700 hover:text-purple-300'
          }`}
        >
          <div className="font-semibold text-sm">{spread.label}</div>
          <div className="text-xs mt-1 opacity-70">{spread.description}</div>
          <div className="text-xs mt-1 opacity-50">{spread.cardCount} card{spread.cardCount > 1 ? 's' : ''}</div>
        </button>
      ))}
    </div>
  );
}
