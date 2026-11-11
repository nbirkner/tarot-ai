export function Sigil({ className = 'sigil' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M16 1.2 21.2 10.8 30.8 16 21.2 21.2 16 30.8 10.8 21.2 1.2 16 10.8 10.8 16 1.2ZM16 9.2 18.3 13.7 22.8 16 18.3 18.3 16 22.8 13.7 18.3 9.2 16 13.7 13.7 16 9.2Z"
      />
    </svg>
  );
}
