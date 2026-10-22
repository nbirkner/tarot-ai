import { AppLink } from '../../components/BasePath';

const models = [
  {
    name: 'Juggernaut Lightning Flux',
    provider: 'RunDiffusion',
    role: 'Card art generation',
    description:
      'Every tarot card you see is generated fresh for your reading. Juggernaut Lightning Flux, a FLUX model on Together serverless, renders a unique 512×768 illustration for each card — styled to your chosen deck aesthetic.',
    detail: 'One image per card drawn. If the picture cannot be made, the card keeps its name on a plain art placeholder and the reading continues.',
    docsUrl: 'https://docs.together.ai/docs/serverless-models',
    docsLabel: 'Serverless models',
    apiRef: 'https://docs.together.ai/reference/images',
    apiLabel: 'Images API reference',
  },
  {
    name: 'Reference photo',
    provider: 'RunDiffusion',
    role: 'Personalized card faces',
    description:
      'When you upload a photo, the same image model is asked to use it as a reference for the figures on the card. If that request is refused, the card is drawn without the photo.',
    detail: 'Optional. A failed picture never blocks the reading — the card shows a placeholder instead.',
    docsUrl: 'https://docs.together.ai/docs/inference/images/reference-images',
    docsLabel: 'Reference images',
    apiRef: 'https://docs.together.ai/reference/images',
    apiLabel: 'Images API reference',
  },
  {
    name: 'Muse Glimmer 30B',
    provider: 'Meta',
    role: 'Reading & follow-up questions',
    description:
      'The heart of the oracle. Muse Glimmer 30B powers the reading engine — interpreting each card in parallel, synthesizing the full spread into a unified narrative, and generating the personalized follow-up questions before the cards are drawn.',
    detail: 'Structured JSON output for consistent reading format. Parallel card calls for speed. Temperature 0.85 for readings, 0.8 for questions.',
    docsUrl: 'https://docs.together.ai/docs/serverless-models',
    docsLabel: 'Serverless models',
    apiRef: 'https://docs.together.ai/reference/chat-completions',
    apiLabel: 'Chat completions reference',
  },
];

export default function AboutPage() {
  return (
    <main className="page">
      <div>
        <p className="label">About</p>
        <h1>A side project that got out of hand.</h1>
      </div>

      <div className="prose">
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
          corporate &ldquo;AI-powered wellness&rdquo; kind of way. Just, what if I used the
          models I work with every day to build something I actually believed in?
        </p>
        <p>
          This is that. A real tarot app, built with real AI, made by someone who uses both
          sincerely and is fine being judged for it.
        </p>
      </div>

      <blockquote className="quote">
        <p>
          &ldquo;You may sense the truth before you fully understand it. You may feel closure
          before you see visible results. You may know something must change — even if you
          cannot yet explain why.&rdquo;
        </p>
        <p className="cite">
          — Divine Feminine Energy, <em>The Lunar Eclipse in Virgo</em>
        </p>
      </blockquote>

      <div className="stack">
        <p className="label">Built with Together AI</p>
        <p className="prose">
          Every card drawn, every reading delivered, every question asked — powered by models
          running on the Together AI inference platform.
        </p>
        {models.map((m) => (
          <article key={m.name} className="model">
            <p className="label">{m.role}</p>
            <h2>{m.name}</h2>
            <p className="provider">{m.provider}</p>
            <p className="body">{m.description}</p>
            <p className="detail">{m.detail}</p>
            <div className="links">
              <a href={m.docsUrl} target="_blank" rel="noopener noreferrer">
                {m.docsLabel} →
              </a>
              <a href={m.apiRef} target="_blank" rel="noopener noreferrer">
                {m.apiLabel} →
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="note">
        <p className="label">The Platform</p>
        <p>
          All models run on Together AI&apos;s serverless inference platform — no infrastructure
          to manage, no GPUs to provision. One API key, unified billing, sub-second cold starts.
        </p>
        <div className="links">
          <a href="https://docs.together.ai/docs/quickstart" target="_blank" rel="noopener noreferrer">
            Quickstart →
          </a>
          <a href="https://www.together.ai" target="_blank" rel="noopener noreferrer">
            together.ai →
          </a>
        </div>
      </div>

      <div>
        <AppLink href="/reading" className="btn-primary">
          Begin a Reading
        </AppLink>
      </div>
    </main>
  );
}
