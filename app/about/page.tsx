import Link from 'next/link';

const models = [
  {
    name: 'FLUX.1-schnell',
    provider: 'Black Forest Labs',
    role: 'Card art generation',
    description:
      'Every tarot card you see is generated fresh for your reading. FLUX.1-schnell renders a unique 512×768 illustration for each card — styled to your chosen deck aesthetic — in under two seconds.',
    detail: 'One image per card drawn. Each reading generates its own original art.',
    docsUrl: 'https://docs.together.ai/docs/serverless-models',
    docsLabel: 'Serverless models',
    apiRef: 'https://docs.together.ai/reference/images',
    apiLabel: 'Images API reference',
    accent: 'var(--gold)',
    symbol: '◈',
  },
  {
    name: 'FLUX.1-kontext-pro',
    provider: 'Black Forest Labs',
    role: 'Personalized card faces',
    description:
      'When you upload a photo, FLUX.1-kontext-pro uses image-to-image generation to weave your likeness into the human figures of each card. Your face appears in the Empress, the Hermit, the Lovers.',
    detail: 'Optional. Falls back to FLUX.1-schnell if unavailable.',
    docsUrl: 'https://docs.together.ai/docs/flux-kontext',
    docsLabel: 'FLUX Kontext guide',
    apiRef: 'https://docs.together.ai/reference/images',
    apiLabel: 'Images API reference',
    accent: 'var(--rose)',
    symbol: '◉',
  },
  {
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    role: 'Reading & follow-up questions',
    description:
      'The heart of the oracle. Llama 4 Maverick powers the reading engine — interpreting each card in parallel, synthesizing the full spread into a unified narrative, and generating the personalized follow-up questions before the cards are drawn.',
    detail: 'Structured JSON output for consistent reading format. Parallel card calls for speed. Temperature 0.85 for readings, 0.8 for questions.',
    docsUrl: 'https://docs.together.ai/docs/serverless-models',
    docsLabel: 'Serverless models',
    apiRef: 'https://docs.together.ai/reference/chat-completions',
    apiLabel: 'Chat completions reference',
    accent: 'var(--sage)',
    symbol: '◇',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pt-20 pb-20" style={{ background: 'var(--cream)' }}>
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <p
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 11,
              letterSpacing: '0.25em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            About
          </p>
          <h1
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 28,
              letterSpacing: '0.06em',
              color: 'var(--brown-dark)',
              fontWeight: 400,
              marginBottom: 12,
            }}
          >
            A side project that got out of hand.
          </h1>
        </div>

        {/* Ornamental divider */}
        <div className="flex items-center gap-3 mb-10" style={{ color: 'var(--gold)', opacity: 0.5 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
          <span style={{ fontSize: 10 }}>✦</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-gold)' }} />
        </div>

        {/* Story */}
        <div
          className="space-y-5 mb-12"
          style={{
            fontFamily: 'Spectral, serif',
            fontSize: 18,
            lineHeight: 1.75,
            color: 'var(--brown-mid)',
          }}
        >
          <p>
            By day I&apos;m a product manager at Together AI, which means I spend a lot of time
            thinking about inference infrastructure, model benchmarks, and token pricing. Very
            grounded. Very left-brained.
          </p>
          <p>
            I also pull tarot cards most mornings and have strong opinions about my rising sign.
          </p>
          <p>
            For a long time those two sides of my life existed in completely separate tabs. I
            didn&apos;t really talk about the tarot thing at work, and I didn&apos;t think too hard
            about the AI thing during my more witchy moments. This was probably fine.
          </p>
          <p>
            But I kept thinking: what would it actually look like to merge them? Not in a
            corporate &ldquo;AI-powered wellness&rdquo; kind of way. Just — what if I used the
            models I work with every day to build something I actually believed in?
          </p>
          <p>
            This is that. A real tarot app, built with real AI, made by someone who uses both
            sincerely and is fine being judged for it.
          </p>
        </div>

        {/* Readwise quote */}
        <div
          style={{
            borderLeft: '3px solid var(--border-gold)',
            paddingLeft: 24,
            marginBottom: 48,
          }}
        >
          <p
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: 17,
              fontStyle: 'italic',
              color: 'var(--brown-dark)',
              lineHeight: 1.75,
              marginBottom: 10,
            }}
          >
            &ldquo;You may sense the truth before you fully understand it. You may feel closure
            before you see visible results. You may know something must change — even if you
            cannot yet explain why.&rdquo;
          </p>
          <p
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: 13,
              color: 'var(--brown-light)',
              letterSpacing: '0.04em',
            }}
          >
            — Divine Feminine Energy, <em>The Lunar Eclipse in Virgo</em>
          </p>
        </div>

        {/* Built with */}
        <p
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 11,
            letterSpacing: '0.25em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          Built with Together AI
        </p>

        <p
          style={{
            fontFamily: 'Spectral, serif',
            fontSize: 17,
            fontStyle: 'italic',
            color: 'var(--brown-mid)',
            lineHeight: 1.65,
            marginBottom: 32,
          }}
        >
          Every card drawn, every reading delivered, every question asked — powered by models
          running on the Together AI inference platform.
        </p>

        {/* Model cards */}
        <div className="space-y-6">
          {models.map((m) => (
            <div
              key={m.name}
              style={{
                background: 'var(--cream-card)',
                border: '1px solid var(--border-gold)',
                borderLeft: `3px solid ${m.accent}`,
                borderRadius: 4,
                padding: 'clamp(18px, 4vw, 28px) clamp(18px, 5vw, 32px)',
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p
                    style={{
                      fontFamily: 'Spectral, serif',
                      fontSize: 12,
                      letterSpacing: '0.15em',
                      color: m.accent,
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    {m.role}
                  </p>
                  <h2
                    style={{
                      fontFamily: 'Cinzel, serif',
                      fontSize: 15,
                      letterSpacing: '0.06em',
                      color: 'var(--brown-dark)',
                      fontWeight: 400,
                      marginBottom: 2,
                    }}
                  >
                    {m.name}
                  </h2>
                  <p
                    style={{
                      fontFamily: 'Spectral, serif',
                      fontSize: 13,
                      fontStyle: 'italic',
                      color: 'var(--brown-light)',
                    }}
                  >
                    {m.provider}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 28,
                    color: m.accent,
                    opacity: 0.3,
                    flexShrink: 0,
                    lineHeight: 1,
                    marginTop: 4,
                  }}
                >
                  {m.symbol}
                </span>
              </div>

              <p
                style={{
                  fontFamily: 'Spectral, serif',
                  fontSize: 17,
                  lineHeight: 1.65,
                  color: 'var(--brown-mid)',
                  marginBottom: 10,
                }}
              >
                {m.description}
              </p>

              <p
                style={{
                  fontFamily: 'Spectral, serif',
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: 'var(--brown-light)',
                  marginBottom: 16,
                }}
              >
                {m.detail}
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href={m.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'Spectral, serif',
                    fontSize: 14,
                    color: m.accent,
                    textDecoration: 'none',
                    borderBottom: `1px solid ${m.accent}`,
                    paddingBottom: 1,
                    opacity: 0.85,
                  }}
                >
                  {m.docsLabel} →
                </a>
                <a
                  href={m.apiRef}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'Spectral, serif',
                    fontSize: 14,
                    color: 'var(--brown-light)',
                    textDecoration: 'none',
                    borderBottom: '1px solid var(--border-gold)',
                    paddingBottom: 1,
                  }}
                >
                  {m.apiLabel} →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Together AI platform note */}
        <div
          style={{
            marginTop: 32,
            padding: '20px 24px',
            background: 'var(--gold-pale)',
            border: '1px solid var(--border-gold)',
            borderRadius: 4,
          }}
        >
          <p
            style={{
              fontFamily: 'Cinzel, serif',
              fontSize: 11,
              letterSpacing: '0.2em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            The Platform
          </p>
          <p
            style={{
              fontFamily: 'Spectral, serif',
              fontSize: 16,
              lineHeight: 1.65,
              color: 'var(--brown-mid)',
              marginBottom: 14,
            }}
          >
            All models run on Together AI&apos;s serverless inference platform — no infrastructure
            to manage, no GPUs to provision. One API key, unified billing, sub-second cold starts.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://docs.together.ai/docs/quickstart"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'Spectral, serif',
                fontSize: 14,
                color: 'var(--gold)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--gold)',
                paddingBottom: 1,
              }}
            >
              Quickstart →
            </a>
            <a
              href="https://www.together.ai"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'Spectral, serif',
                fontSize: 14,
                color: 'var(--brown-light)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--border-gold)',
                paddingBottom: 1,
              }}
            >
              together.ai →
            </a>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/reading"
            className="btn-primary"
            style={{ textDecoration: 'none', display: 'inline-block' }}
          >
            Begin a Reading
          </Link>
        </div>

      </div>
    </main>
  );
}
