'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
    <main
      className="min-h-screen pt-20 pb-16"
      style={{ background: 'var(--cream)' }}
    >
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 28,
              letterSpacing: '0.08em',
              color: 'var(--brown-dark)',
              fontWeight: 400,
              marginBottom: 6,
            }}
          >
            Your Collection
          </h1>
          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 16,
              fontStyle: 'italic',
              color: 'var(--brown-light)',
            }}
          >
            {entries.length} card{entries.length !== 1 ? 's' : ''} pulled
          </p>
        </div>

        {/* Ornamental divider */}
        <div
          className="flex items-center gap-3 mb-6"
          style={{ color: 'var(--gold)', opacity: 0.5 }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
          <span style={{ fontSize: 10 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(['all', 'major', 'wands', 'cups', 'swords', 'pentacles'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 13,
                padding: '4px 14px',
                borderRadius: 20,
                border: filter === f ? '1px solid var(--gold)' : '1px solid var(--border-gold)',
                background: filter === f ? 'var(--gold-pale)' : 'transparent',
                color: filter === f ? 'var(--brown-dark)' : 'var(--brown-light)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {entries.length === 0 ? (
          <div className="text-center py-20">
            <p
              style={{
                fontSize: 36,
                color: 'var(--gold)',
                opacity: 0.6,
                marginBottom: 16,
              }}
            >
              ✦
            </p>
            <p
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 18,
                fontStyle: 'italic',
                color: 'var(--brown-light)',
                marginBottom: 16,
              }}
            >
              No cards yet. Your readings will gather here.
            </p>
            <Link
              href="/reading"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 16,
                color: 'var(--gold)',
                textDecoration: 'none',
              }}
            >
              Begin a reading →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {filtered.map((entry, i) => (
              <div key={i} className="space-y-1">
                {entry.imageUrl ? (
                  <div
                    className="aspect-[2/3] overflow-hidden"
                    style={{
                      borderRadius: 4,
                      border: '1px solid var(--border-gold)',
                      background: 'var(--cream-card)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(196, 146, 42, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <Image
                      src={entry.imageUrl}
                      alt={entry.card.name}
                      width={120}
                      height={180}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="aspect-[2/3] flex items-center justify-center"
                    style={{
                      borderRadius: 4,
                      border: '1px solid var(--border-gold)',
                      background: 'var(--parchment)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(196, 146, 42, 0.18)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: 10,
                        color: 'var(--brown-mid)',
                        textAlign: 'center',
                        padding: '0 8px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {entry.card.name}
                    </span>
                  </div>
                )}
                <p
                  className="truncate"
                  style={{
                    fontFamily: 'Cinzel, serif',
                    fontSize: 10,
                    color: 'var(--brown-dark)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {entry.card.name}
                </p>
                <p
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: 12,
                    fontStyle: 'italic',
                    color: 'var(--brown-light)',
                  }}
                >
                  {new Date(entry.readingDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
