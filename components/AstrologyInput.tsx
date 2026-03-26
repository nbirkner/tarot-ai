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
    { id: 'sun-sign', label: 'Sun Sign', desc: 'Quick & easy' },
    { id: 'birth-data', label: 'Full Chart', desc: 'Deepest reading' },
  ];

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: '1px solid',
              borderColor: tab === t.id ? 'var(--gold)' : 'var(--border-gold)',
              borderRadius: 2,
              background: tab === t.id ? 'var(--gold-pale)' : 'var(--cream-card)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center' as const,
            }}
          >
            <p
              style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 11,
                letterSpacing: '0.1em',
                color: tab === t.id ? 'var(--brown-dark)' : 'var(--brown-light)',
                marginBottom: 2,
              }}
            >
              {t.label}
            </p>
            <p
              style={{
                fontFamily: 'Spectral, serif',
                fontSize: 13,
                fontStyle: 'italic',
                color: 'var(--brown-light)',
              }}
            >
              {t.desc}
            </p>
          </button>
        ))}
      </div>

      {tab === 'sun-sign' && (
        <div>
          <p
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: 14,
              fontStyle: 'italic',
              color: 'var(--brown-light)',
              marginBottom: 8,
            }}
          >
            Your sun sign shapes the reading&apos;s lens.
          </p>
          <select
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
        <div className="space-y-3">
          <p
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: 14,
              fontStyle: 'italic',
              color: 'var(--brown-light)',
            }}
          >
            Your natal chart allows a deeply personal reading.
          </p>
          <input
            type="date"
            className="input-field"
            value={value.type === 'birth-data' ? value.date : ''}
            onChange={(e) =>
              value.type === 'birth-data' && onChange({ ...value, date: e.target.value })
            }
          />
          <input
            type="time"
            placeholder="Birth time (optional)"
            className="input-field"
            value={value.type === 'birth-data' ? value.time : ''}
            onChange={(e) =>
              value.type === 'birth-data' && onChange({ ...value, time: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Birth location, e.g. Paris, France"
            className="input-field"
            value={value.type === 'birth-data' ? value.location : ''}
            onChange={(e) =>
              value.type === 'birth-data' && onChange({ ...value, location: e.target.value })
            }
          />
          <input
            type="number"
            min={-90}
            max={90}
            step={0.01}
            placeholder="e.g. 40.71"
            className="input-field"
            value={value.type === 'birth-data' && value.lat != null ? value.lat : ''}
            onChange={(e) =>
              value.type === 'birth-data' &&
              onChange({ ...value, lat: e.target.value !== '' ? parseFloat(e.target.value) : undefined })
            }
          />
          <input
            type="number"
            min={-180}
            max={180}
            step={0.01}
            placeholder="e.g. -74.01"
            className="input-field"
            value={value.type === 'birth-data' && value.lon != null ? value.lon : ''}
            onChange={(e) =>
              value.type === 'birth-data' &&
              onChange({ ...value, lon: e.target.value !== '' ? parseFloat(e.target.value) : undefined })
            }
          />
          <p
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: 12,
              fontStyle: 'italic',
              color: 'var(--brown-light)',
              marginTop: 2,
            }}
          >
            Latitude &amp; longitude for Rising sign calculation (optional). Find your coordinates at latlong.net
          </p>
        </div>
      )}
    </div>
  );
}
