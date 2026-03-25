'use client';

interface QuestionInputProps {
  value: string;
  onChange: (v: string) => void;
  onSkip: () => void;
}

const SUGGESTIONS = [
  'What do I need to focus on right now?',
  'What energy surrounds me this week?',
  'What is blocking my growth?',
  'What should I release?',
  'What is the path forward?',
];

export function QuestionInput({ value, onChange, onSkip }: QuestionInputProps) {
  return (
    <div className="space-y-4">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ask your question, or leave blank for a general reading..."
        rows={3}
        className="w-full bg-slate-900 border border-purple-800/60 rounded-lg px-4 py-3 text-purple-100 placeholder-purple-600 text-sm resize-none focus:outline-none focus:border-purple-500"
      />
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="text-xs px-3 py-1.5 rounded-full border border-purple-900/50 text-purple-500 hover:text-purple-300 hover:border-purple-700 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="text-sm text-purple-600 hover:text-purple-400 transition-colors"
      >
        Skip — just pull a card →
      </button>
    </div>
  );
}
