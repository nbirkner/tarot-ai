import { AppLink } from '../components/BasePath';
import { GeometricFace } from '../components/GeometricFace';

const SAMPLE = [
  { name: 'The Star', position: 'Past', variant: 0 as const },
  { name: 'The Magician', position: 'Present', variant: 1 as const },
  { name: 'The Sun', position: 'Future', variant: 2 as const },
];

export default function Home() {
  return (
    <main className="home">
      <div className="home-stage">
        <div className="home-copy">
          <h1>
            Your future called. <em>It has notes.</em>
          </h1>
          <p className="lede">
            Ancient practice. Freshly hallucinated. Pick a deck, ask the thing on your mind, and we&apos;ll make some art and see what it says.
          </p>
          <div className="actions">
            <AppLink href="/reading" className="btn-primary">
              Begin Your Reading
            </AppLink>
            <p className="fine">No account. The void doesn&apos;t need your email.</p>
            <p className="fine">Powered by Together AI. The oracle is not liable for epiphanies.</p>
          </div>
          <ul className="tag-row">
            <li>AI-Illustrated</li>
            <li>Not Therapy</li>
            <li>Free</li>
            <li>Unsolicited Advice</li>
          </ul>
        </div>

        <figure className="sample">
          <ul className="fan">
            {SAMPLE.map((card) => (
              <li key={card.name}>
                <div className="oracle-shell" data-size="lg">
                  <GeometricFace variant={card.variant} />
                </div>
                <p className="card-name">{card.name}</p>
                <p className="mono-label">{card.position}</p>
              </li>
            ))}
          </ul>
          <figcaption className="thought">
            <h2 className="thought-title">The Cards Have a Thought</h2>
            <p className="thought-lead">
              A past that taught you to trust your own light meets a present full of possibility. The next chapter looks brighter than your inner critic would like to admit.
            </p>
            <p className="fine">A sample spread. Yours is drawn and illustrated on the spot.</p>
          </figcaption>
        </figure>
      </div>
    </main>
  );
}
