import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="float">
          <div className="text-6xl mb-4">✦</div>
        </div>
        <h1 className="text-4xl font-bold text-purple-100 tracking-tight">
          tarot-ai
        </h1>
        <p className="text-purple-400 text-lg leading-relaxed">
          AI-generated card art. Personalized readings. Drawn with the moon, the season, and you in mind.
        </p>
        <p className="text-purple-600 text-sm">
          Powered by Together AI · Every card is unique
        </p>
        <Link
          href="/reading"
          className="inline-block mt-4 px-8 py-3 bg-purple-800 hover:bg-purple-700 text-purple-100 rounded-full font-medium transition-colors text-sm"
        >
          Begin your reading →
        </Link>
      </div>
    </main>
  );
}
