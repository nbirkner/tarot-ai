import { NextRequest, NextResponse } from 'next/server';
import { readingLimitResponse } from '../../../lib/reading-quota';
import { paidChat } from '../../../lib/together-call';
import { SYNTHESIS_MAX_TOKENS } from '../../../lib/together';

export const maxDuration = 60;

const SYSTEM_STANDARD = `You are Celeste — an exceptionally gifted tarot reader who synthesizes card readings into a coherent narrative. You always respond in valid JSON. No markdown, no text outside JSON.`;

const SYSTEM_OSHO = `You are a Zen oracle rooted in Osho's teachings. You synthesize Osho Zen Tarot readings into a unified reflection — not prediction, but recognition. You illuminate what is already present. You always respond in valid JSON. No markdown, no text outside JSON.`;

export async function POST(req: NextRequest) {
  const limited = await readingLimitResponse(req);
  if (limited) return limited;

  if (!process.env.TOGETHER_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const {
      cardReadings,
      question, spreadType, formattedAstrology, userContext,
      moonPhase, dayOfWeek, season, timeOfDay,
      deckStyle,
    } = body;

    const isOshoZen = deckStyle === 'osho-zen';
    const SYSTEM = isOshoZen ? SYSTEM_OSHO : SYSTEM_STANDARD;

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
      'osho-quickie': 'Super Quickie (The Mirror)',
      'osho-three': 'Mind / Heart / Being',
      'osho-diamond': 'The Diamond (5-Card)',
      'osho-bird': 'Flying Bird (7-Card)',
    };

    const prompt = isOshoZen
      ? `Synthesize these Osho Zen Tarot card readings into a unified reflection.

QUESTION: "${question || 'No specific question'}"
SPREAD: ${spreadNames[spreadType] ?? spreadType}

CARD READINGS:
${cardSummaries}

ASTROLOGICAL PROFILE:
${formattedAstrology || 'Not provided'}

${userContext ? `USER CONTEXT: "${userContext}"` : ''}

TIMING: Moon: ${moonPhase} · ${dayOfWeek} · ${season} · ${timeOfDay}

RULES:
- overallEnergy: 2-3 sentences capturing the essential quality of awareness in this reading — reference specific cards
- synthesis: 4-6 sentences reflecting the unified picture these cards reveal. Name specific cards. Speak to what is present right now, not what will happen. End with the one recognition these cards most invite.
- affirmation: one sentence in second person — a recognition that lands like something they already knew but hadn't named. Specific to this reading.
- notableTiming: 1-2 sentences on what the current moment in nature and the cosmos reflects
- Tone: spacious, direct, Zen. Not prediction — recognition. Not fortune-telling — witnessing.
- Never use: "journey", "path forward", "exciting times", "trust the process"

Respond with JSON only:
{
  "overallEnergy": "...",
  "synthesis": "...",
  "affirmation": "...",
  "notableTiming": "..."
}`
      : `Synthesize these tarot card readings into a unified whole.

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

    const togetherAbort = new AbortController();
    const togetherTimeout = setTimeout(() => togetherAbort.abort(), 45000);
    try {
      const result = await paidChat({
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
        maxTokens: SYNTHESIS_MAX_TOKENS,
        stream: true,
        scope: 'generate-synthesis',
        signal: togetherAbort.signal,
      });
      if (!result.ok) {
        if (!result.failure || result.response.status === 403) return result.response;
        return NextResponse.json(
          {
            error: 'Synthesis failed',
            providerStatus: result.failure.status,
            providerCode: result.failure.providerCode,
          },
          { status: 500 },
        );
      }
      if (result.mode !== 'stream') {
        return NextResponse.json({ error: 'Empty response' }, { status: 502 });
      }
      return result.response;
    } finally {
      clearTimeout(togetherTimeout);
    }
  } catch (err) {
    console.error('generate-synthesis error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
