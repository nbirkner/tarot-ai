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
        <p className="label" style={{ marginBottom: 12 }}>
          Suggested questions
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => onChange(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={onSkip} className="link-quiet">
        Skip — let the cards speak freely →
      </button>
    </div>
  );
}
