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
    if (t === 'birth-data') onChange({ type: 'birth-data', date: '', time: '', location: '', lat: undefined, lon: undefined });
  }

  const tabs: { id: Tab; label: string; desc: string }[] = [
    { id: 'none', label: 'Skip', desc: 'General reading' },
    { id: 'sun-sign', label: 'Sun Sign', desc: 'Quick and easy' },
    { id: 'birth-data', label: 'Full Chart', desc: 'Deepest reading' },
  ];

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="choice-row" role="group" aria-label="Chart detail">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className="choice-tile"
            aria-pressed={tab === t.id}
            onClick={() => switchTab(t.id)}
          >
            <strong>{t.label}</strong>
            <span className="fine">{t.desc}</span>
          </button>
        ))}
      </div>

      {tab === 'sun-sign' && (
        <div className="stack" style={{ gap: 8 }}>
          <label className="mono-label" htmlFor="sun-sign">
            Sun Sign
          </label>
          <p className="fine">Your sun sign shapes the reading&apos;s lens.</p>
          <select
            id="sun-sign"
            className="input-field"
            value={value.type === 'sun-sign' ? value.sign : ''}
            onChange={(e) => onChange({ type: 'sun-sign', sign: e.target.value })}
          >
            <option value="">Select your sun sign...</option>
            {SUN_SIGN_LIST.map((sign) => (
              <option key={sign} value={sign}>
                {sign}
              </option>
            ))}
          </select>
        </div>
      )}

      {tab === 'birth-data' && (
        <div className="stack" style={{ gap: 10 }}>
          <p className="fine">Your natal chart allows a deeply personal reading.</p>
          <label className="mono-label" htmlFor="birth-date">
            Birth Date
          </label>
          <input
            id="birth-date"
            type="date"
            className="input-field"
            value={value.type === 'birth-data' ? value.date : ''}
            onChange={(e) =>
              value.type === 'birth-data' && onChange({ ...value, date: e.target.value })
            }
          />
          <label className="mono-label" htmlFor="birth-time">
            Birth Time
          </label>
          <input
            id="birth-time"
            type="time"
            className="input-field"
            value={value.type === 'birth-data' ? value.time : ''}
            onChange={(e) =>
              value.type === 'birth-data' && onChange({ ...value, time: e.target.value })
            }
          />
          <label className="mono-label" htmlFor="birth-place">
            Birth Place
          </label>
          <input
            id="birth-place"
            type="text"
            placeholder="Paris, France"
            className="input-field"
            value={value.type === 'birth-data' ? value.location : ''}
            onChange={(e) =>
              value.type === 'birth-data' && onChange({ ...value, location: e.target.value })
            }
          />
          <label className="mono-label" htmlFor="birth-lat">
            Latitude
          </label>
          <input
            id="birth-lat"
            type="number"
            min={-90}
            max={90}
            step={0.01}
            placeholder="40.71"
            className="input-field"
            value={value.type === 'birth-data' && value.lat != null ? value.lat : ''}
            onChange={(e) =>
              value.type === 'birth-data' &&
              onChange({ ...value, lat: e.target.value !== '' ? parseFloat(e.target.value) : undefined })
            }
          />
          <label className="mono-label" htmlFor="birth-lon">
            Longitude
          </label>
          <input
            id="birth-lon"
            type="number"
            min={-180}
            max={180}
            step={0.01}
            placeholder="-74.01"
            className="input-field"
            value={value.type === 'birth-data' && value.lon != null ? value.lon : ''}
            onChange={(e) =>
              value.type === 'birth-data' &&
              onChange({ ...value, lon: e.target.value !== '' ? parseFloat(e.target.value) : undefined })
            }
          />
          <p className="fine">
            Latitude and longitude are optional, for a rising sign. Look up coordinates at latlong.net.
          </p>
        </div>
      )}
    </div>
  );
}
