'use client';

import { useState } from 'react';
import { AstrologyInput as AstrologyInputType } from '../lib/types';
import { SUN_SIGN_LIST } from '../lib/astronomy';

interface AstrologyInputProps {
  value: AstrologyInputType;
  onChange: (v: AstrologyInputType) => void;
}

type Tab = 'none' | 'sun-sign' | 'birth-data';

export function AstrologyInput({ value, onChange }: AstrologyInputProps) {
  const [tab, setTab] = useState<Tab>(value.type as Tab);

  function switchTab(t: Tab) {
    setTab(t);
    if (t === 'none') onChange({ type: 'none' });
    if (t === 'sun-sign') onChange({ type: 'sun-sign', sign: '' });
    if (t === 'birth-data') onChange({ type: 'birth-data', date: '', time: '', location: '' });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['none', 'sun-sign', 'birth-data'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              tab === t
                ? 'border-purple-500 bg-purple-950 text-purple-200'
                : 'border-purple-900/50 text-purple-500 hover:text-purple-300'
            }`}
          >
            {t === 'none' ? 'Skip' : t === 'sun-sign' ? 'Sun Sign' : 'Full Birth Data'}
          </button>
        ))}
      </div>

      {tab === 'sun-sign' && (
        <select
          className="w-full bg-slate-900 border border-purple-800/60 rounded-lg px-3 py-2 text-purple-200 text-sm"
          value={value.type === 'sun-sign' ? value.sign : ''}
          onChange={(e) => onChange({ type: 'sun-sign', sign: e.target.value })}
        >
          <option value="">Select your sun sign...</option>
          {SUN_SIGN_LIST.map((sign: string) => (
            <option key={sign} value={sign}>{sign}</option>
          ))}
        </select>
      )}

      {tab === 'birth-data' && (
        <div className="space-y-3">
          <input
            type="date"
            placeholder="Birth date"
            className="w-full bg-slate-900 border border-purple-800/60 rounded-lg px-3 py-2 text-purple-200 text-sm"
            value={value.type === 'birth-data' ? value.date : ''}
            onChange={(e) =>
              value.type === 'birth-data' &&
              onChange({ ...value, date: e.target.value })
            }
          />
          <input
            type="time"
            placeholder="Birth time (optional)"
            className="w-full bg-slate-900 border border-purple-800/60 rounded-lg px-3 py-2 text-purple-200 text-sm"
            value={value.type === 'birth-data' ? value.time : ''}
            onChange={(e) =>
              value.type === 'birth-data' &&
              onChange({ ...value, time: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Birth location (city, country)"
            className="w-full bg-slate-900 border border-purple-800/60 rounded-lg px-3 py-2 text-purple-200 text-sm"
            value={value.type === 'birth-data' ? value.location : ''}
            onChange={(e) =>
              value.type === 'birth-data' &&
              onChange({ ...value, location: e.target.value })
            }
          />
        </div>
      )}
    </div>
  );
}
