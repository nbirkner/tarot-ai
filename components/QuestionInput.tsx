'use client';

interface QuestionInputProps {
  value: string;
  onChange: (v: string) => void;
  onSkip: () => void;
}

const SUGGESTIONS = [
  'What does this moment want from me?',
  'Where should I direct my energy?',
  'What am I not seeing clearly?',
  'What should I release?',
  'What is the path forward?',
  'What do I need to hear today?',
  'Why does Mercury retrograde personally target me?',
];

export function QuestionInput({ value, onChange, onSkip }: QuestionInputProps) {
  return (
    <div className="space-y-5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What weighs on your heart? Or leave blank for an open reading..."
        rows={4}
        className="input-field"
        style={{ resize: 'none', lineHeight: 1.6 }}
      />

      <div>
        <p
          style={{
            fontFamily: 'Spectral, serif',
            fontSize: 13,
            color: 'var(--brown-light)',
            fontStyle: 'italic',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Suggested questions
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              style={{
                fontFamily: 'Spectral, serif',
                fontSize: 14,
                fontStyle: 'italic',
                color: 'var(--brown-mid)',
                border: '1px solid var(--border-gold)',
                borderRadius: 2,
                padding: '5px 12px',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.color = 'var(--gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-gold)';
                e.currentTarget.style.color = 'var(--brown-mid)';
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSkip}
        style={{
          fontFamily: 'Spectral, serif',
          fontSize: 15,
          color: 'var(--brown-light)',
          fontStyle: 'italic',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Skip — let the cards speak freely →
      </button>
    </div>
  );
}
