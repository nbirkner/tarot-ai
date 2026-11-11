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
    <div className="stack" style={{ gap: 16 }}>
      <label className="mono-label" htmlFor="question">
        Your Question
      </label>
      <textarea
        id="question"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What weighs on you? Or leave this blank for an open reading."
        rows={4}
        className="input-field"
        style={{ resize: 'vertical', lineHeight: 1.5 }}
      />

      <div>
        <p className="mono-label" style={{ marginBottom: 10 }}>
          Suggested Questions
        </p>
        <div className="keyword-row">
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => onChange(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={onSkip} className="link-quiet">
        Skip. Let the cards speak freely.
      </button>
    </div>
  );
}
