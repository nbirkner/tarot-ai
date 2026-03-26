import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;
const MODEL = 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8';

const SYSTEM_STANDARD = `You are Celeste — an exceptionally gifted tarot reader who has studied the cards for twenty years. You are warm, precise, and occasionally sharply honest. You always respond in valid JSON. No markdown, no text outside JSON.`;

const SYSTEM_OSHO = `You are a Zen oracle rooted in Osho's teachings. You read the Osho Zen Tarot with clarity, directness, and deep compassion. You speak to what is present in this moment — not prediction, but recognition. You see through the mind's games to the essential. You always respond in valid JSON. No markdown, no text outside JSON.`;

export async function POST(req: NextRequest) {
  if (!TOGETHER_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      card, position, reversed,
      spreadPositions, otherCards,
      question, formattedAstrology, userContext,
      moonPhase, dayOfWeek, season, timeOfDay,
      deckStyle,
    } = body;

    const isOshoZen = deckStyle === 'osho-zen';
    const SYSTEM = isOshoZen ? SYSTEM_OSHO : SYSTEM_STANDARD;

    const otherCardsStr = otherCards?.length
      ? otherCards.join(', ')
      : 'none';

    const prompt = isOshoZen
      ? `Interpret a single Osho Zen Tarot card in its spread position.

CARD: ${card}
POSITION: "${position}"
FULL SPREAD: ${spreadPositions.join(' / ')}
OTHER CARDS: ${otherCardsStr}

QUESTION: "${question || 'No specific question — what does this person most need to see right now?'}"

ASTROLOGICAL PROFILE:
${formattedAstrology || 'Not provided'}

${userContext ? `USER CONTEXT (weave into the interpretation): "${userContext}"` : ''}

TIMING: Moon: ${moonPhase} · ${dayOfWeek} · ${season} · ${timeOfDay}

RULES:
- Open with the quality of awareness or energy this card reflects in this position
- Speak to what is present in this moment, not future prediction
- Draw on Zen and Osho teachings: witnessing, consciousness, the present, the watcher
- Reference astrology if provided
- End with a question or observation to sit with — something that opens rather than closes
- The suits: Fire = life force, creativity, passion; Water = emotion, the heart; Clouds = mind, thought; Rainbows = the material world, celebration
- Tone: direct and clear, but spacious. Not psychic prediction — recognition of what is already here.
- Never use: "journey", "path forward", "exciting times", "trust the process"

Respond with JSON only:
{
  "keywords": ["3-4 specific qualities for THIS card in THIS position — not generic"],
  "interpretation": "4-6 sentences"
}`
      : `Interpret a single tarot card in its spread position.

CARD: ${card}${reversed ? ' (REVERSED)' : ''}
POSITION: "${position}"
FULL SPREAD: ${spreadPositions.join(' / ')}
OTHER CARDS: ${otherCardsStr}

QUESTION: "${question || 'No specific question — what does this person most need to know right now?'}"

ASTROLOGICAL PROFILE:
${formattedAstrology || 'Not provided'}

${userContext ? `USER CONTEXT (weave into the interpretation): "${userContext}"` : ''}

TIMING: Moon: ${moonPhase} · ${dayOfWeek} · ${season} · ${timeOfDay}

RULES:
- Open with what this card means in this specific position
- Connect to the question or user context
- Reference astrology if provided (e.g. "Your Moon in Scorpio intensifies this…")
- End with a specific insight or question for them to sit with
- Never use: "journey", "path forward", "exciting times", "trust the process"
${reversed ? '- REVERSED: interpret as blocked energy, internal experience, or delayed manifestation' : ''}

Respond with JSON only:
{
  "keywords": ["3-4 specific keywords for THIS card in THIS position — not generic"],
  "interpretation": "4-6 sentences"
}`;

    // Timeout the Together AI fetch itself at 25s so we get a clean error
    // before Vercel's 60s function limit kills us silently.
    const togetherAbort = new AbortController();
    const togetherTimeout = setTimeout(() => togetherAbort.abort(), 25000);

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: togetherAbort.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 380,
        stream: true,
      }),
    }).finally(() => clearTimeout(togetherTimeout));

    if (!response.ok) {
      const error = await response.text();
      console.error('Together card-reading error:', error);
      return NextResponse.json({ error: 'Card reading failed' }, { status: 500 });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('generate-card-reading error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
