import Link from 'next/link';

export default function Home() {
  return (
    <main
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 20% 50%, rgba(196,146,42,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 10%, rgba(42,31,20,0.12) 0%, transparent 40%), radial-gradient(ellipse at 60% 90%, rgba(74,122,101,0.05) 0%, transparent 50%), var(--cream)',
      }}
    >
      {/* Dark corner vignettes — top left and top right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 0,
          width: '45%',
          height: '55%',
          background: 'radial-gradient(ellipse at 0% 0%, rgba(15,8,4,0.18) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          right: 0,
          width: '45%',
          height: '55%',
          background: 'radial-gradient(ellipse at 100% 0%, rgba(15,8,4,0.18) 0%, transparent 65%)',
        }}
      />

      {/* Star field — scattered small dots */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.18 }}
      >
        {[
          [8, 12], [15, 45], [22, 8], [35, 72], [42, 28], [55, 88], [62, 15],
          [70, 55], [78, 30], [85, 78], [92, 18], [5, 65], [48, 5], [88, 92],
          [30, 90], [72, 8], [18, 80], [95, 45], [40, 50], [65, 70],
          [12, 30], [25, 60], [38, 18], [50, 82], [60, 40], [74, 68], [82, 12],
          [90, 58], [3, 85], [45, 35], [58, 92], [67, 25], [77, 48], [86, 35],
          [10, 52], [20, 75], [32, 42], [52, 15], [63, 55], [93, 28], [16, 20],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={`${x}%`}
            cy={`${y}%`}
            r={i % 5 === 0 ? 2 : i % 4 === 0 ? 1.5 : i % 7 === 0 ? 2.5 : 1}
            fill="#C4922A"
            style={{
              animation: `star-twinkle ${3 + (i % 9) * 1}s ease-in-out infinite`,
              animationDelay: `${(i * 0.43) % 5}s`,
            }}
          />
        ))}
      </svg>

      {/* Botanical SVG — top left, decorative */}
      <svg
        className="absolute pointer-events-none float-slow"
        style={{ top: '6%', left: '3%', opacity: 0.16 }}
        width="160"
        height="200"
        viewBox="0 0 160 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M80 190 C80 130 30 100 15 40" fill="none" stroke="#4A7A65" strokeWidth="1.5" />
        <path d="M80 190 C80 130 130 100 145 40" fill="none" stroke="#4A7A65" strokeWidth="1.5" />
        <path d="M80 150 C80 110 50 90 40 60" fill="none" stroke="#4A7A65" strokeWidth="1" />
        <path d="M80 150 C80 110 110 90 120 60" fill="none" stroke="#4A7A65" strokeWidth="1" />
        <ellipse cx="15" cy="40" rx="18" ry="11" fill="#4A7A65" transform="rotate(-30 15 40)" />
        <ellipse cx="145" cy="40" rx="18" ry="11" fill="#4A7A65" transform="rotate(30 145 40)" />
        <ellipse cx="40" cy="60" rx="13" ry="8" fill="#4A7A65" transform="rotate(-20 40 60)" opacity="0.8" />
        <ellipse cx="120" cy="60" rx="13" ry="8" fill="#4A7A65" transform="rotate(20 120 60)" opacity="0.8" />
        <circle cx="80" cy="190" r="6" fill="#B5706E" opacity="0.6" />
        <circle cx="55" cy="130" r="3" fill="#B5706E" opacity="0.45" />
        <circle cx="105" cy="130" r="3" fill="#B5706E" opacity="0.45" />
        <circle cx="65" cy="100" r="2" fill="#B5706E" opacity="0.35" />
        <circle cx="95" cy="100" r="2" fill="#B5706E" opacity="0.35" />
      </svg>

      {/* Crescent moon — top right */}
      <svg
        className="absolute pointer-events-none float"
        style={{ top: '8%', right: '4%', opacity: 0.22 }}
        width="90"
        height="90"
        viewBox="0 0 90 90"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M45 8 Q70 22 70 45 Q70 68 45 82 Q82 75 86 45 Q86 15 45 8Z"
          fill="#C4922A"
        />
        <circle cx="74" cy="20" r="1.5" fill="#C4922A" opacity="0.6" />
        <circle cx="82" cy="35" r="1" fill="#C4922A" opacity="0.5" />
        <circle cx="78" cy="58" r="1.5" fill="#C4922A" opacity="0.4" />
      </svg>

      {/* Constellation — bottom left */}
      <svg
        className="absolute pointer-events-none"
        style={{ bottom: '8%', left: '4%', opacity: 0.2 }}
        width="130"
        height="100"
        viewBox="0 0 130 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {(
          [
            [25, 25],
            [65, 12],
            [100, 35],
            [80, 72],
            [40, 68],
          ] as [number, number][]
        ).map(([x, y], i, pts) => {
          const next = pts[(i + 1) % pts.length];
          return (
            <g key={i}>
              <line
                x1={x} y1={y}
                x2={next[0]} y2={next[1]}
                stroke="#C4922A"
                strokeWidth="0.5"
                opacity="0.5"
              />
              <circle cx={x} cy={y} r="2.5" fill="#C4922A" />
            </g>
          );
        })}
      </svg>

      {/* Large ornate tarot card silhouette — right side, slightly rotated, bleeds off edge */}
      <div
        className="hidden sm:block absolute pointer-events-none float-slow"
        style={{
          right: '-60px',
          top: '50%',
          transform: 'translateY(-50%) rotate(6deg)',
          opacity: 0.12,
        }}
      >
        <svg
          width="280"
          height="460"
          viewBox="0 0 280 460"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Card body */}
          <rect
            x="10" y="10" width="260" height="440"
            rx="14" ry="14"
            fill="none"
            stroke="#C4922A"
            strokeWidth="2"
          />
          {/* Outer decorative frame */}
          <rect
            x="22" y="22" width="236" height="416"
            rx="10" ry="10"
            fill="none"
            stroke="#C4922A"
            strokeWidth="1"
            opacity="0.7"
          />
          {/* Inner frame */}
          <rect
            x="36" y="36" width="208" height="388"
            rx="7" ry="7"
            fill="none"
            stroke="#C4922A"
            strokeWidth="0.8"
            opacity="0.5"
          />
          {/* Innermost frame */}
          <rect
            x="50" y="50" width="180" height="360"
            rx="5" ry="5"
            fill="none"
            stroke="#C4922A"
            strokeWidth="0.6"
            opacity="0.4"
          />
          {/* Central crescent moon */}
          <path
            d="M140 160 Q170 185 170 220 Q170 255 140 280 Q185 272 192 220 Q192 168 140 160Z"
            fill="#C4922A"
            opacity="0.6"
          />
          {/* Stars around moon */}
          <path d="M115 175 L118 185 L128 185 L120 191 L123 201 L115 195 L107 201 L110 191 L102 185 L112 185Z" fill="#C4922A" opacity="0.5" transform="scale(0.5) translate(115,175)" />
          <circle cx="105" cy="200" r="3" fill="#C4922A" opacity="0.4" />
          <circle cx="175" cy="195" r="2.5" fill="#C4922A" opacity="0.4" />
          <circle cx="118" cy="250" r="2" fill="#C4922A" opacity="0.35" />
          <circle cx="162" cy="248" r="2" fill="#C4922A" opacity="0.35" />
          {/* Corner ornaments */}
          <path d="M50 50 L70 50 L50 70Z" fill="#C4922A" opacity="0.3" />
          <path d="M230 50 L210 50 L230 70Z" fill="#C4922A" opacity="0.3" />
          <path d="M50 410 L70 410 L50 390Z" fill="#C4922A" opacity="0.3" />
          <path d="M230 410 L210 410 L230 390Z" fill="#C4922A" opacity="0.3" />
          {/* Diamond ornament top */}
          <path d="M140 62 L148 78 L140 94 L132 78Z" fill="none" stroke="#C4922A" strokeWidth="1" opacity="0.5" />
          {/* Diamond ornament bottom */}
          <path d="M140 366 L148 382 L140 398 L132 382Z" fill="none" stroke="#C4922A" strokeWidth="1" opacity="0.5" />
          {/* Botanical stems bottom third */}
          <path d="M140 340 C140 310 110 295 100 270" fill="none" stroke="#4A7A65" strokeWidth="1.2" opacity="0.5" />
          <path d="M140 340 C140 310 170 295 180 270" fill="none" stroke="#4A7A65" strokeWidth="1.2" opacity="0.5" />
          <ellipse cx="100" cy="270" rx="14" ry="8" fill="#4A7A65" opacity="0.4" transform="rotate(-25 100 270)" />
          <ellipse cx="180" cy="270" rx="14" ry="8" fill="#4A7A65" opacity="0.4" transform="rotate(25 180 270)" />
          {/* Horizontal line dividers */}
          <line x1="56" y1="130" x2="224" y2="130" stroke="#C4922A" strokeWidth="0.6" opacity="0.4" />
          <line x1="56" y1="308" x2="224" y2="308" stroke="#C4922A" strokeWidth="0.6" opacity="0.4" />
          {/* Small dot row */}
          {[85, 105, 125, 140, 155, 175, 195].map((x, i) => (
            <circle key={i} cx={x} cy="119" r="1.2" fill="#C4922A" opacity="0.4" />
          ))}
          {[85, 105, 125, 140, 155, 175, 195].map((x, i) => (
            <circle key={i} cx={x} cy="319" r="1.2" fill="#C4922A" opacity="0.4" />
          ))}
        </svg>
      </div>

      {/* ─── ASYMMETRIC LAYOUT ─── */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl w-full mx-auto sm:mx-0">

          {/* Top ornament line */}
          <div
            className="flex items-center gap-4 mb-10"
            style={{
              animation: 'shimmer-in 0.6s ease-out forwards',
              opacity: 0,
            }}
          >
            <div className="h-px flex-1 max-w-[80px]" style={{ background: 'var(--border-gold)' }} />
            <span style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.3em' }}>✦ ☽ ✦</span>
          </div>

          {/* Pinyon Script atmospheric tagline — the centerpiece */}
          <div
            style={{
              animation: 'shimmer-in 0.7s ease-out 0.15s forwards',
              opacity: 0,
            }}
          >
            <p
              style={{
                fontFamily: 'Pinyon Script, cursive',
                fontSize: 'clamp(36px, 9vw, 110px)',
                color: 'var(--brown-dark)',
                lineHeight: 1.05,
                letterSpacing: '0.01em',
                marginBottom: '0.1em',
                textShadow: '0 2px 40px rgba(196,146,42,0.2)',
              }}
            >
              Read the cards.
            </p>
            <p
              style={{
                fontFamily: 'Pinyon Script, cursive',
                fontSize: 'clamp(40px, 7vw, 84px)',
                color: 'var(--gold)',
                lineHeight: 1.05,
                letterSpacing: '0.01em',
              }}
            >
              Know yourself.
            </p>
          </div>

          {/* TAROT · AI — Cinzel display title, smaller, below the script */}
          <div
            className="mt-8 mb-6"
            style={{
              animation: 'shimmer-in 0.6s ease-out 0.35s forwards',
              opacity: 0,
            }}
          >
            <div className="flex items-center gap-5">
              <h1
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 'clamp(18px, 2.5vw, 28px)',
                  fontWeight: 400,
                  color: 'var(--brown-dark)',
                  letterSpacing: '0.22em',
                  lineHeight: 1,
                }}
              >
                TAROT · AI
              </h1>
              <div className="h-px flex-1 max-w-xs" style={{ background: 'var(--border-gold)' }} />
              <p
                style={{
                  fontFamily: 'Spectral, serif',
                  fontSize: 12,
                  letterSpacing: '0.18em',
                  color: 'var(--brown-light)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                Your Personal Oracle
              </p>
            </div>
          </div>

          {/* Tagline prose */}
          <div
            className="max-w-md mb-4"
            style={{
              animation: 'shimmer-in 0.6s ease-out 0.5s forwards',
              opacity: 0,
            }}
          >
            <p
              style={{
                fontFamily: 'Spectral, serif',
                fontSize: 'clamp(18px, 2vw, 22px)',
                fontStyle: 'italic',
                color: 'var(--brown-mid)',
                lineHeight: 1.55,
                fontWeight: 300,
              }}
            >
              AI-generated card art, woven from the stars,
              the moon, and the moment you ask.
            </p>
          </div>

          {/* Floating moon phase indicator — decorative */}
          <div
            className="mb-8"
            style={{
              animation: 'shimmer-in 0.6s ease-out 0.58s forwards, float-gentle 6s ease-in-out 0.58s infinite',
              opacity: 0,
            }}
          >
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6 }}>
                <path
                  d="M8 2 Q13 5 13 8 Q13 11 8 14 Q14 12.5 15 8 Q14.5 3 8 2Z"
                  fill="var(--brown-light)"
                />
              </svg>
              <p
                style={{
                  fontFamily: 'Spectral, serif',
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: 'var(--brown-light)',
                  letterSpacing: '0.08em',
                }}
              >
                ✦ your oracle awaits ✦
              </p>
            </div>
          </div>

          {/* Feature pills */}
          <div
            className="flex flex-wrap gap-2 mb-10"
            style={{
              animation: 'shimmer-in 0.6s ease-out 0.65s forwards',
              opacity: 0,
            }}
          >
            {['Unique card art', 'Moon & astrology', 'Your own oracle', 'Daily readings'].map((tag) => (
              <span
                key={tag}
                className="feature-pill"
                style={{
                  fontFamily: 'Spectral, serif',
                  fontSize: 13,
                  color: 'var(--brown-mid)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 2,
                  padding: '4px 14px',
                  background: 'rgba(253,250,246,0.6)',
                  letterSpacing: '0.04em',
                  display: 'inline-block',
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div
            style={{
              animation: 'shimmer-in 0.6s ease-out 0.8s forwards',
              opacity: 0,
            }}
          >
            <div className="w-full sm:w-auto">
              <Link href="/reading" className="block sm:inline-block">
                <button
                  className="btn-primary w-full sm:w-auto"
                  style={{ fontSize: 13, letterSpacing: '0.2em', padding: '16px 52px' }}
                >
                  BEGIN YOUR READING
                </button>
              </Link>
            </div>
          </div>

          {/* Credit */}
          <div
            className="mt-8"
            style={{
              animation: 'shimmer-in 0.5s ease-out 1s forwards',
              opacity: 0,
            }}
          >
            <p
              style={{
                fontFamily: 'Spectral, serif',
                fontSize: 13,
                color: 'var(--brown-light)',
                opacity: 0.65,
              }}
            >
              Powered by Together AI · Every card uniquely generated · Readings influenced by the stars
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
