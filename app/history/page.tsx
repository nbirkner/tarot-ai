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
            Reading History
          </h1>
          <p
            style={{
              fontFamily: 'EB Garamond, serif',
              fontSize: 16,
              fontStyle: 'italic',
              color: 'var(--brown-light)',
            }}
          >
            {readings.length} reading{readings.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Ornamental divider */}
        <div
          className="flex items-center gap-3 mb-8"
          style={{ color: 'var(--gold)', opacity: 0.5 }}
        >
          <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
          <span style={{ fontSize: 10 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
        </div>

        {/* localStorage notice */}
        <div
          style={{
            background: 'var(--gold-pale)',
            border: '1px solid var(--border-gold)',
            borderRadius: 4,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ color: 'var(--gold)', fontSize: 14, flexShrink: 0, marginTop: 1 }}>☽</span>
          <p
            style={{
              fontFamily: 'EB Garamond, serif',
              fontSize: 15,
              fontStyle: 'italic',
              color: 'var(--brown-mid)',
              lineHeight: 1.5,
            }}
          >
            Your readings are saved locally in this browser. They may be lost if you clear your browser data, open a private window, or switch devices.
          </p>
        </div>

        {/* Empty state */}
        {readings.length === 0 ? (
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
                fontFamily: 'EB Garamond, serif',
                fontSize: 18,
                fontStyle: 'italic',
                color: 'var(--brown-light)',
                marginBottom: 16,
              }}
            >
              No readings yet.
            </p>
            <Link
              href="/reading"
              style={{
                fontFamily: 'EB Garamond, serif',
                fontSize: 16,
                color: 'var(--gold)',
                textDecoration: 'none',
              }}
            >
              Begin your first reading →
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {readings.map((r) => {
                const spread = SPREADS.find((s) => s.type === r.spreadType);
                return (
                  <div
                    key={r.id}
                    style={{
                      background: 'var(--cream-card)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: 4,
                      padding: '20px 24px',
                      transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = 'var(--gold)';
                      el.style.transform = 'translateY(-1px)';
                      el.style.boxShadow = '0 4px 20px rgba(196, 146, 42, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.borderColor = 'var(--border-gold)';
                      el.style.transform = 'translateY(0)';
                      el.style.boxShadow = 'none';
                    }}
                  >
                    {/* Question */}
                    <p
                      style={{
                        fontFamily: 'Cinzel, serif',
                        fontSize: 14,
                        letterSpacing: '0.06em',
                        color: 'var(--brown-dark)',
                        marginBottom: 4,
                        fontWeight: 400,
                      }}
                    >
                      {r.question || 'General reading'}
                    </p>

                    {/* Spread + date */}
                    <p
                      style={{
                        fontFamily: 'EB Garamond, serif',
                        fontSize: 14,
                        fontStyle: 'italic',
                        color: 'var(--brown-light)',
                        marginBottom: 12,
                      }}
                    >
                      {spread?.label} · {new Date(r.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>

                    {/* Synthesis snippet */}
                    {r.synthesis && (
                      <p
                        style={{
                          fontFamily: 'EB Garamond, serif',
                          fontSize: 16,
                          color: 'var(--brown-mid)',
                          lineHeight: 1.6,
                          borderLeft: '3px solid var(--border-gold)',
                          paddingLeft: 12,
                          marginBottom: 12,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {r.synthesis}
                      </p>
                    )}

                    {/* Cards */}
                    <p
                      style={{
                        fontFamily: 'EB Garamond, serif',
                        fontSize: 12,
                        color: 'var(--brown-light)',
                      }}
                    >
                      {r.cards.map((c, i) => (
                        <span key={i}>
                          {c.card.name}{i < r.cards.length - 1 ? ' · ' : ''}
                        </span>
                      ))}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="text-center mt-10">
              <Link href="/reading" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Begin a New Reading
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
