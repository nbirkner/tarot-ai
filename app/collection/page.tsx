'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CollectionEntry, getCollection } from '../../lib/storage';

export default function CollectionPage() {
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pentacles'>('all');

  useEffect(() => {
    setEntries(getCollection());
  }, []);

  const filtered = entries.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'major') return e.card.arcana === 'major';
    return e.card.suit === filter;
  });

  return (
    <main className="min-h-screen bg-slate-950 pt-20 pb-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-purple-200 text-2xl font-semibold mb-2">Your Collection</h1>
        <p className="text-purple-500 text-sm mb-6">{entries.length} card{entries.length !== 1 ? 's' : ''} pulled</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'major', 'wands', 'cups', 'swords', 'pentacles'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${
                filter === f
                  ? 'border-purple-500 bg-purple-950 text-purple-200'
                  : 'border-purple-900/50 text-purple-500 hover:text-purple-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-purple-600">
            <p className="text-4xl mb-4">✦</p>
            <p>No cards yet. Start a reading.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filtered.map((entry, i) => (
              <div key={i} className="space-y-1">
                {entry.imageUrl ? (
                  <div className="rounded-lg overflow-hidden border border-purple-900/40 aspect-[2/3]">
                    <Image
                      src={entry.imageUrl}
                      alt={entry.card.name}
                      width={120}
                      height={180}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-purple-900/40 aspect-[2/3] bg-purple-950/50 flex items-center justify-center">
                    <span className="text-purple-500 text-xs text-center px-2">{entry.card.name}</span>
                  </div>
                )}
                <p className="text-purple-400 text-xs truncate">{entry.card.name}</p>
                <p className="text-purple-600 text-xs">{new Date(entry.readingDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
