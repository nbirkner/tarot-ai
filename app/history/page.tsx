'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ReadingResult } from '../../lib/types';
import { getReadings } from '../../lib/storage';
import { SPREADS } from '../../lib/tarot';

export default function HistoryPage() {
  const [readings, setReadings] = useState<ReadingResult[]>([]);

  useEffect(() => {
    setReadings(getReadings());
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 pt-20 pb-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-purple-200 text-2xl font-semibold mb-2">Reading History</h1>
        <p className="text-purple-500 text-sm mb-6">{readings.length} reading{readings.length !== 1 ? 's' : ''}</p>

        {readings.length === 0 ? (
          <div className="text-center py-20 text-purple-600">
            <p className="text-4xl mb-4">✦</p>
            <p>No readings yet.</p>
            <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">
              Start your first reading →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {readings.map((r) => {
              const spread = SPREADS.find((s) => s.type === r.spreadType);
              return (
                <div key={r.id} className="border border-purple-900/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-purple-200 text-sm font-medium">
                        {r.question || 'General reading'}
                      </p>
                      <p className="text-purple-500 text-xs mt-0.5">
                        {spread?.label} · {new Date(r.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-purple-300/70 text-xs leading-relaxed line-clamp-2">{r.synthesis}</p>
                  <div className="flex flex-wrap gap-1">
                    {r.cards.map((c, i) => (
                      <span key={i} className="text-xs text-purple-600">
                        {c.card.name}{i < r.cards.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
