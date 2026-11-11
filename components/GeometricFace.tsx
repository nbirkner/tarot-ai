const FACES = [
  { ground: '#140C0A', ink: '#FF5A36', inner: 'none', ring: '#FF5A36' },
  { ground: '#FFF6F0', ink: '#140C0A', inner: '#FF5A36', ring: '#140C0A' },
  { ground: '#FFB199', ink: '#140C0A', inner: '#140C0A', ring: '#140C0A' },
] as const;

export function GeometricFace({ variant = 0 }: { variant?: 0 | 1 | 2 }) {
  const face = FACES[variant];
  return (
    <svg className="geo" viewBox="0 0 200 300" aria-hidden="true">
      <rect width="200" height="300" fill={face.ground} />
      <rect x="14" y="14" width="172" height="272" fill="none" stroke={face.ink} strokeWidth="2" />
      <path d="M22 34H34M28 28V40" stroke={face.ink} strokeWidth="2" fill="none" />
      <path d="M166 34H178M172 28V40" stroke={face.ink} strokeWidth="2" fill="none" />
      <path d="M22 266H34M28 260V272" stroke={face.ink} strokeWidth="2" fill="none" />
      <path d="M166 266H178M172 260V272" stroke={face.ink} strokeWidth="2" fill="none" />
      <polygon points="100,42 164,150 100,258 36,150" fill="none" stroke={face.ink} strokeWidth="3" />
      <polygon
        points="100,86 138,150 100,214 62,150"
        fill={face.inner}
        stroke={face.ink}
        strokeWidth="3"
      />
      {variant !== 2 && (
        <ellipse cx="100" cy="150" rx="74" ry="26" fill="none" stroke={face.ring} strokeWidth="2" />
      )}
      {variant !== 1 && (
        <ellipse cx="100" cy="150" rx="26" ry="74" fill="none" stroke={face.ring} strokeWidth="2" />
      )}
      <polygon points="100,140 106,150 100,160 94,150" fill={face.ink} />
    </svg>
  );
}
