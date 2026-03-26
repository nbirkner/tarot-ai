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
      {/* Dark corner vignettes */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0, left: 0, width: '45%', height: '55%',
          background: 'radial-gradient(ellipse at 0% 0%, rgba(15,8,4,0.18) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0, right: 0, width: '45%', height: '55%',
          background: 'radial-gradient(ellipse at 100% 0%, rgba(15,8,4,0.18) 0%, transparent 65%)',
        }}
      />

      {/* Concentric circles — slow ambient pulse */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '50%', left: '68%',
          transform: 'translate(-50%, -50%)',
          width: 600, height: 600,
          opacity: 0.045,
        }}
      >
        {[1, 0.72, 0.48, 0.28].map((scale, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '1px solid var(--gold)',
              transform: `scale(${scale})`,
              top: '50%', left: '50%',
              width: '100%', height: '100%',
              marginTop: '-50%', marginLeft: '-50%',
              animation: `pulse-candle ${5 + i * 1.5}s ease-in-out ${i * 0.7}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Star field */}
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

      {/* Botanical SVG — top left */}
      <svg
        className="absolute pointer-events-none float-slow"
        style={{ top: '6%', left: '3%', opacity: 0.16 }}
        width="160" height="200" viewBox="0 0 160 200"
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
        width="90" height="90" viewBox="0 0 90 90"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M45 8 Q70 22 70 45 Q70 68 45 82 Q82 75 86 45 Q86 15 45 8Z" fill="#C4922A" />
        <circle cx="74" cy="20" r="1.5" fill="#C4922A" opacity="0.6" />
        <circle cx="82" cy="35" r="1" fill="#C4922A" opacity="0.5" />
        <circle cx="78" cy="58" r="1.5" fill="#C4922A" opacity="0.4" />
      </svg>

      {/* Constellation — bottom left */}
      <svg
        className="absolute pointer-events-none"
        style={{ bottom: '8%', left: '4%', opacity: 0.2 }}
        width="130" height="100" viewBox="0 0 130 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {(
          [[25, 25], [65, 12], [100, 35], [80, 72], [40, 68]] as [number, number][]
        ).map(([x, y], i, pts) => {
          const next = pts[(i + 1) % pts.length];
          return (
            <g key={i}>
              <line x1={x} y1={y} x2={next[0]} y2={next[1]} stroke="#C4922A" strokeWidth="0.5" opacity="0.5" />
              <circle cx={x} cy={y} r="2.5" fill="#C4922A" />
            </g>
          );
        })}
      </svg>

      {/* Large ornate tarot card silhouette — right side */}
      <div
        className="hidden sm:block absolute pointer-events-none float-slow"
        style={{ right: '-60px', top: '50%', transform: 'translateY(-50%) rotate(6deg)', opacity: 0.12 }}
      >
        <svg width="280" height="460" viewBox="0 0 280 460" xmlns="http://www.w3.org/2000/svg">
          <rect x="10" y="10" width="260" height="440" rx="14" ry="14" fill="none" stroke="#C4922A" strokeWidth="2" />
          <rect x="22" y="22" width="236" height="416" rx="10" ry="10" fill="none" stroke="#C4922A" strokeWidth="1" opacity="0.7" />
          <rect x="36" y="36" width="208" height="388" rx="7" ry="7" fill="none" stroke="#C4922A" strokeWidth="0.8" opacity="0.5" />
          <rect x="50" y="50" width="180" height="360" rx="5" ry="5" fill="none" stroke="#C4922A" strokeWidth="0.6" opacity="0.4" />
          <path d="M140 160 Q170 185 170 220 Q170 255 140 280 Q185 272 192 220 Q192 168 140 160Z" fill="#C4922A" opacity="0.6" />
          <path d="M115 175 L118 185 L128 185 L120 191 L123 201 L115 195 L107 201 L110 191 L102 185 L112 185Z" fill="#C4922A" opacity="0.5" transform="scale(0.5) translate(115,175)" />
          <circle cx="105" cy="200" r="3" fill="#C4922A" opacity="0.4" />
          <circle cx="175" cy="195" r="2.5" fill="#C4922A" opacity="0.4" />
          <circle cx="118" cy="250" r="2" fill="#C4922A" opacity="0.35" />
          <circle cx="162" cy="248" r="2" fill="#C4922A" opacity="0.35" />
          <path d="M50 50 L70 50 L50 70Z" fill="#C4922A" opacity="0.3" />
          <path d="M230 50 L210 50 L230 70Z" fill="#C4922A" opacity="0.3" />
          <path d="M50 410 L70 410 L50 390Z" fill="#C4922A" opacity="0.3" />
          <path d="M230 410 L210 410 L230 390Z" fill="#C4922A" opacity="0.3" />
          <path d="M140 62 L148 78 L140 94 L132 78Z" fill="none" stroke="#C4922A" strokeWidth="1" opacity="0.5" />
          <path d="M140 366 L148 382 L140 398 L132 382Z" fill="none" stroke="#C4922A" strokeWidth="1" opacity="0.5" />
          <path d="M140 340 C140 310 110 295 100 270" fill="none" stroke="#4A7A65" strokeWidth="1.2" opacity="0.5" />
          <path d="M140 340 C140 310 170 295 180 270" fill="none" stroke="#4A7A65" strokeWidth="1.2" opacity="0.5" />
          <ellipse cx="100" cy="270" rx="14" ry="8" fill="#4A7A65" opacity="0.4" transform="rotate(-25 100 270)" />
          <ellipse cx="180" cy="270" rx="14" ry="8" fill="#4A7A65" opacity="0.4" transform="rotate(25 180 270)" />
          <line x1="56" y1="130" x2="224" y2="130" stroke="#C4922A" strokeWidth="0.6" opacity="0.4" />
          <line x1="56" y1="308" x2="224" y2="308" stroke="#C4922A" strokeWidth="0.6" opacity="0.4" />
          {[85, 105, 125, 140, 155, 175, 195].map((x, i) => (
            <circle key={i} cx={x} cy="119" r="1.2" fill="#C4922A" opacity="0.4" />
          ))}
          {[85, 105, 125, 140, 155, 175, 195].map((x, i) => (
            <circle key={i} cx={x} cy="319" r="1.2" fill="#C4922A" opacity="0.4" />
          ))}
        </svg>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-24">
        <div className="max-w-5xl w-full mx-auto sm:mx-0">

          {/* Top rule line with ornament */}
          <div
            className="flex items-center gap-4 mb-12"
            style={{ animation: 'shimmer-in 0.6s ease-out forwards', opacity: 0 }}
          >
            <div className="h-px flex-1 max-w-[100px]" style={{ background: 'linear-gradient(to right, transparent, var(--border-gold))' }} />
            <span style={{ color: 'var(--gold)', fontSize: 10, letterSpacing: '0.4em', opacity: 0.7 }}>✦ ☽ ✦</span>
            <div className="h-px w-6" style={{ background: 'var(--border-gold)' }} />
          </div>

          {/* WORDMARK — monumental Pinyon Script headline */}
          <div
            style={{ animation: 'shimmer-in 0.8s ease-out 0.1s forwards', opacity: 0 }}
          >
            <p
              style={{
                fontFamily: 'var(--font-pinyon), cursive',
                fontSize: 'clamp(52px, 13vw, 148px)',
                color: 'var(--brown-dark)',
                lineHeight: 0.95,
                letterSpacing: '-0.01em',
                marginBottom: '0.05em',
                textShadow: '0 4px 60px rgba(196,146,42,0.18)',
              }}
            >
              Read the cards.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-pinyon), cursive',
                fontSize: 'clamp(44px, 10vw, 116px)',
                color: 'var(--gold)',
                lineHeight: 0.95,
                letterSpacing: '-0.01em',
              }}
            >
              Know yourself.
            </p>
          </div>

          {/* Product wordmark — small, precise, editorial */}
          <div
            className="mt-10 mb-5"
            style={{ animation: 'shimmer-in 0.6s ease-out 0.4s forwards', opacity: 0 }}
          >
            <div className="flex items-center gap-5">
              <h1
                style={{
                  fontFamily: 'var(--font-cinzel), serif',
                  fontSize: 'clamp(11px, 1.4vw, 16px)',
                  fontWeight: 400,
                  color: 'var(--brown-dark)',
                  letterSpacing: '0.3em',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                }}
              >
                TAROT · AI
              </h1>
              <div className="h-px flex-1 max-w-[200px]" style={{ background: 'var(--border-gold)' }} />
              <p
                style={{
                  fontFamily: 'var(--font-spectral), serif',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  color: 'var(--brown-light)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                Your Personal Oracle (No Liability)
              </p>
            </div>
          </div>

          {/* Tagline — whispering italic */}
          <div
            className="max-w-sm mb-10"
            style={{ animation: 'shimmer-in 0.6s ease-out 0.6s forwards', opacity: 0 }}
          >
            <p
              style={{
                fontFamily: 'var(--font-spectral), serif',
                fontSize: 'clamp(16px, 1.8vw, 20px)',
                fontStyle: 'italic',
                color: 'var(--brown-mid)',
                lineHeight: 1.6,
                fontWeight: 400,
                opacity: 0.85,
              }}
            >
              AI-generated card art, woven from the stars,
              the moon, and the moment you ask. It's not therapy.
              It's better.
            </p>
          </div>

          {/* Provenance tags — elegant, not pill-y */}
          <div
            className="flex flex-wrap gap-x-6 gap-y-3 mb-12"
            style={{ animation: 'shimmer-in 0.6s ease-out 0.75s forwards', opacity: 0 }}
          >
            {[
              { symbol: '✦', label: 'Unique card art' },
              { symbol: '☽', label: 'Moon & astrology' },
              { symbol: '✦', label: 'Your own oracle' },
              { symbol: '☽', label: 'Mostly accurate™' },
            ].map((item) => (
              <span
                key={item.label}
                style={{
                  fontFamily: 'var(--font-spectral), serif',
                  fontSize: 13,
                  color: 'var(--brown-mid)',
                  letterSpacing: '0.06em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--gold)', fontSize: 9, opacity: 0.7 }}>{item.symbol}</span>
                {item.label}
              </span>
            ))}
          </div>

          {/* CTA — ceremonial invitation */}
          <div
            style={{ animation: 'shimmer-in 0.6s ease-out 0.92s forwards', opacity: 0 }}
          >
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Link href="/reading" className="block sm:inline-block w-full sm:w-auto">
                <button
                  className="btn-primary w-full sm:w-auto"
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.28em',
                    padding: '18px 56px',
                    borderRadius: 1,
                  }}
                >
                  BEGIN YOUR READING
                </button>
              </Link>
              {/* Invitation text beside the button */}
              <p
                style={{
                  fontFamily: 'var(--font-spectral), serif',
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: 'var(--brown-light)',
                  opacity: 0.7,
                  paddingTop: 2,
                  alignSelf: 'center',
                }}
              >
                no account · the stars already know
              </p>
            </div>
          </div>

          {/* Bottom attribution — whisper quiet */}
          <div
            className="mt-14"
            style={{ animation: 'shimmer-in 0.5s ease-out 1.1s forwards', opacity: 0 }}
          >
            <div className="flex items-center gap-4">
              <div className="h-px w-8" style={{ background: 'var(--border-gold)', opacity: 0.6 }} />
              <p
                style={{
                  fontFamily: 'var(--font-spectral), serif',
                  fontSize: 12,
                  color: 'var(--brown-light)',
                  opacity: 0.5,
                  letterSpacing: '0.04em',
                }}
              >
                Powered by Together AI · Every card uniquely generated · Mercury's behavior not guaranteed
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
