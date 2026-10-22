import Link from 'next/link';

export default function Home() {
  return (
    <main className="home">
      <p className="kicker">TAROT · AI · Your Personal Oracle</p>
      <h1>
        Ancient practice.
        <br />
        <span className="accent">Freshly hallucinated.</span>
      </h1>
      <p className="lede">
        It&apos;s 500 years old. It&apos;s also running on a GPU. Both things are true.
      </p>
      <div className="tags">
        <span>✦ AI-illustrated</span>
        <span>☽ Not therapy</span>
        <span>✦ Free</span>
        <span>☽ Unsolicited advice</span>
      </div>
      <div className="actions">
        <Link href="/reading" className="btn-primary">
          BEGIN YOUR READING
        </Link>
        <p className="fine">no account · the void doesn&apos;t need your email</p>
      </div>
      <hr className="rule" />
      <p className="fine">
        Powered by Together AI · Centuries of symbolism, generated in seconds · The oracle is not liable for epiphanies
      </p>
      <p>
        <Link href="/about" className="fine">
          about this →
        </Link>
      </p>
    </main>
  );
}
