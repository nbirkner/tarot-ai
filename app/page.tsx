import Link from 'next/link';

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      style={{ background: 'var(--cream)' }}
    >
      {/* Background ambient circles */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '15%',
          left: '8%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,146,42,0.07) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '20%',
          right: '5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,122,101,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Floating botanical SVG top left */}
      <svg
        className="absolute top-16 left-8 opacity-20 float-slow"
        width="120"
        height="120"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M60 100 C60 60 20 40 10 10" fill="none" stroke="#4A7A65" strokeWidth="1.5" />
        <path d="M60 100 C60 60 100 40 110 10" fill="none" stroke="#4A7A65" strokeWidth="1.5" />
        <ellipse cx="10" cy="10" rx="14" ry="9" fill="#4A7A65" transform="rotate(-30 10 10)" />
        <ellipse cx="110" cy="10" rx="14" ry="9" fill="#4A7A65" transform="rotate(30 110 10)" />
        <circle cx="60" cy="100" r="5" fill="#B5706E" opacity="0.7" />
        <circle cx="30" cy="55" r="3" fill="#B5706E" opacity="0.5" />
        <circle cx="90" cy="55" r="3" fill="#B5706E" opacity="0.5" />
      </svg>

      {/* Floating moon top right */}
      <svg
        className="absolute top-20 right-12 opacity-15 float"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M40 5 Q65 20 65 40 Q65 60 40 75 Q75 68 78 40 Q78 12 40 5Z"
          fill="#C4922A"
        />
      </svg>

      {/* Star constellation bottom left */}
      <svg
        className="absolute bottom-24 left-16 opacity-20"
        width="100"
        height="80"
        viewBox="0 0 100 80"
        xmlns="http://www.w3.org/2000/svg"
      >
        {([[20,20],[50,10],[80,30],[60,60],[30,55]] as [number,number][]).map(([x,y], i) => (
          <g key={i}>
            <line x1={x} y1={y} x2={([[50,10],[80,30],[60,60],[30,55],[20,20]] as [number,number][])[i][0]} y2={([[50,10],[80,30],[60,60],[30,55],[20,20]] as [number,number][])[i][1]} stroke="#C4922A" strokeWidth="0.5" opacity="0.5" />
            <circle cx={x} cy={y} r="2" fill="#C4922A" />
          </g>
        ))}
      </svg>

      {/* Main content */}
      <div className="relative z-10 space-y-8 max-w-lg">
        {/* Ornament */}
        <div className="float">
          <p style={{ color: 'var(--gold)', fontSize: 32, letterSpacing: '0.3em' }}>✦ ☽ ✦</p>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 'clamp(32px, 6vw, 52px)',
              fontWeight: 400,
              color: 'var(--brown-dark)',
              letterSpacing: '0.15em',
              lineHeight: 1.1,
            }}
          >
            TAROT · AI
          </h1>
          <div className="flex items-center gap-3 justify-center">
            <div className="h-px w-16" style={{ background: 'var(--border-gold)' }} />
            <p
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 13,
                letterSpacing: '0.2em',
                color: 'var(--brown-light)',
                textTransform: 'uppercase',
              }}
            >
              Your Personal Oracle
            </p>
            <div className="h-px w-16" style={{ background: 'var(--border-gold)' }} />
          </div>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 22,
            fontStyle: 'italic',
            color: 'var(--brown-mid)',
            lineHeight: 1.5,
            fontWeight: 300,
          }}
        >
          AI-generated card art. Readings woven from the stars,
          the moon, and the moment.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['Unique card art', 'Moon & astrology', 'Your own oracle', 'Daily readings'].map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 13,
                color: 'var(--brown-mid)',
                border: '1px solid var(--border-gold)',
                borderRadius: 2,
                padding: '4px 12px',
                background: 'var(--cream-card)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <Link href="/reading" className="inline-block">
          <button className="btn-primary" style={{ fontSize: 14, letterSpacing: '0.18em', padding: '16px 48px' }}>
            BEGIN YOUR READING
          </button>
        </Link>

        {/* Subtle credit */}
        <p
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 13,
            color: 'var(--brown-light)',
            opacity: 0.7,
          }}
        >
          Powered by Together AI · Every card uniquely generated
        </p>
      </div>
    </main>
  );
}
