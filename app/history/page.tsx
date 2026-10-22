'use client';

import { useEffect, useState } from 'react';
import { AppLink } from '../../components/BasePath';
import { ReadingResult } from '../../lib/types';
import { getReadings } from '../../lib/storage';
import { SPREADS } from '../../lib/tarot';

export default function HistoryPage() {
  const [readings, setReadings] = useState<ReadingResult[]>([]);

  useEffect(() => {
    setReadings(getReadings());
  }, []);

  return (
    <main className="page">
      <div>
        <h1>Reading History</h1>
        <p className="label">
          {readings.length} reading{readings.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="note">
        The oracle has no memory. (Relatable.) Your readings live in this browser only — clear your cache and they&apos;re gone. No cloud. No account. The cards forget everything.
      </div>

      {readings.length === 0 ? (
        <div className="stack">
          <p>The void stares back. It has opinions.</p>
          <AppLink href="/reading" className="link-quiet">
            Ask it something →
          </AppLink>
        </div>
      ) : (
        <>
          <div className="stack">
            {readings.map((r) => {
              const spread = SPREADS.find((s) => s.type === r.spreadType);
              return (
                <article key={r.id} className="model">
                  <h2>{r.question || 'General reading'}</h2>
                  <p className="provider">
                    {spread?.label} · {new Date(r.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                  {r.synthesis && <p className="body clamp-2">{r.synthesis}</p>}
                  <p className="detail">
                    {r.cards.map((c, i) => (
                      <span key={i}>
                        {c.card.name}{i < r.cards.length - 1 ? ' · ' : ''}
                      </span>
                    ))}
                  </p>
                </article>
              );
            })}
          </div>
          <div>
            <AppLink href="/reading" className="btn-primary">
              Begin a New Reading
            </AppLink>
          </div>
        </>
      )}
    </main>
  );
}
