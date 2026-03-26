import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;
const MODEL = 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8';

const SYSTEM = `You are Celeste — an exceptionally gifted tarot reader who synthesizes card readings into a coherent narrative. You always respond in valid JSON. No markdown, no text outside JSON.`;

export async function POST(req: NextRequest) {
  if (!TOGETHER_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      cardReadings,
      question, spreadType, formattedAstrology, userContext,
      moonPhase, dayOfWeek, season, timeOfDay,
    } = body;

    const cardSummaries = cardReadings
      .map((cr: { card: string; position: string; reversed?: boolean; interpretation: string }, i: number) =>
        `${i + 1}. ${cr.card}${cr.reversed ? ' (Reversed)' : ''} — Position: "${cr.position}"\n   ${cr.interpretation}`,
      )
      .join('\n\n');

    const spreadNames: Record<string, string> = {
      single: 'Single Card',
      three: 'Three-Card (Past / Present / Future)',
      five: 'Five-Card',
      celtic: 'Celtic Cross',
      'celtic-cross': 'Celtic Cross',
    };

    const prompt = `Synthesize these tarot card readings into a unified whole.

QUESTION: "${question || 'No specific question'}"
SPREAD: ${spreadNames[spreadType] ?? spreadType}

CARD READINGS:
${cardSummaries}

ASTROLOGICAL PROFILE:
${formattedAstrology || 'Not provided'}

${userContext ? `USER CONTEXT: "${userContext}"` : ''}

TIMING: Moon: ${moonPhase} · ${dayOfWeek} · ${season} · ${timeOfDay}

RULES:
- overallEnergy: 2-3 sentences capturing the core theme — reference specific card combinations
- synthesis: 4-6 sentences telling the STORY these cards together tell. Name specific cards. Call out any tensions or contradictions. End with the one thing the cards most want this person to know.
- affirmation: one sentence in second person that lands like a truth they already knew — specific to their reading, not generic
- notableTiming: 1-2 sentences on what the current celestial moment adds
- Never use: "journey", "path forward", "exciting times", "trust the process"

Respond with JSON only:
{
  "overallEnergy": "...",
  "synthesis": "...",
  "affirmation": "...",
  "notableTiming": "..."
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
        max_tokens: 700,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Together synthesis error:', error);
      return NextResponse.json({ error: 'Synthesis failed' }, { status: 500 });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('generate-synthesis error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
