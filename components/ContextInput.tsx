'use client';

import { useState, useEffect } from 'react';

interface ContextInputProps {
  question: string;
  value: string;
  onChange: (context: string) => void;
}

function compileContext(
  situation: string,
  questions: string[],
  answers: Record<number, string>
): string {
  const parts: string[] = [];
  if (situation.trim()) parts.push(`Situation: ${situation.trim()}`);
  questions.forEach((q, i) => {
    if (answers[i]?.trim()) parts.push(`${q}: ${answers[i].trim()}`);
  });
  return parts.join('\n\n');
}

export function ContextInput({ question, value: _value, onChange }: ContextInputProps) {
  const [situationText, setSituationText] = useState('');
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<number, string>>({});
  const [isLoadingFollowUps, setIsLoadingFollowUps] = useState(false);

  useEffect(() => {
    onChange(compileContext(situationText, followUpQuestions, followUpAnswers));
  }, [situationText, followUpAnswers, followUpQuestions, onChange]);

  async function handleGenerateFollowUps() {
    setIsLoadingFollowUps(true);
    try {
      const res = await fetch('/api/generate-follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setFollowUpQuestions(data.questions || []);
    } catch {
      // silently fail — follow-ups are optional
    } finally {
      setIsLoadingFollowUps(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Situation textarea */}
      <div>
        <label
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 11,
            letterSpacing: '0.15em',
            color: 'var(--brown-mid)',
            display: 'block',
            marginBottom: 8,
          }}
        >
          WHAT IS HAPPENING IN YOUR LIFE RIGHT NOW?
        </label>
        <textarea
          className="input-field"
          rows={4}
          placeholder="Share as much or as little as you'd like. The more specific you are, the more personal your reading will be. This is private."
          value={situationText}
          onChange={(e) => setSituationText(e.target.value)}
          style={{ width: '100%', resize: 'vertical', minHeight: 100 }}
        />
        <p
          style={{
            fontFamily: 'EB Garamond, serif',
            fontSize: 13,
            fontStyle: 'italic',
            color: 'var(--brown-light)',
            marginTop: 6,
          }}
        >
          Optional. Nothing you write here is stored or saved.
        </p>
      </div>

      {/* Follow-up questions section — only show if question exists */}
      {question.trim() && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
            <span
              style={{
                fontFamily: 'EB Garamond, serif',
                fontSize: 13,
                color: 'var(--brown-light)',
                fontStyle: 'italic',
              }}
            >
              or let the oracle ask you
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
          </div>

          {followUpQuestions.length === 0 ? (
            <button
              onClick={handleGenerateFollowUps}
              disabled={isLoadingFollowUps}
              className="btn-secondary w-full"
              style={{ fontSize: 12 }}
            >
              {isLoadingFollowUps ? '✦ Reading your question...' : '✦ Generate follow-up questions'}
            </button>
          ) : (
            <div className="space-y-4">
              {followUpQuestions.map((q, i) => (
                <div key={i}>
                  <label
                    style={{
                      fontFamily: 'EB Garamond, serif',
                      fontSize: 16,
                      fontStyle: 'italic',
                      color: 'var(--brown-dark)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    {q}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Your answer (optional)"
                    value={followUpAnswers[i] || ''}
                    onChange={(e) => {
                      const newAnswers = { ...followUpAnswers, [i]: e.target.value };
                      setFollowUpAnswers(newAnswers);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
