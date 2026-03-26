import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;
const MODEL = 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8';

const SYSTEM = `You are Celeste — an exceptionally gifted tarot reader who has studied the cards for twenty years. You are warm, precise, and occasionally sharply honest. You always respond in valid JSON. No markdown, no text outside JSON.`;

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
    } = body;

    const otherCardsStr = otherCards?.length
      ? otherCards.join(', ')
      : 'none';

    const prompt = `Interpret a single tarot card in its spread position.

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

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 480,
        stream: true,
      }),
    });

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
      },
    });
  } catch (err) {
    console.error('generate-card-reading error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
