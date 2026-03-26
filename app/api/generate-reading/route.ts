import { NextRequest, NextResponse } from 'next/server';
import { GenerateReadingRequest } from '../../../lib/types';

export const runtime = 'edge'; // 30s timeout vs 10s serverless

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;
const READING_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo';

const SYSTEM_PROMPT = `You are Celeste — an exceptionally gifted tarot reader and astrologer who has studied the cards and stars for twenty years. You are the user's most trusted, brilliant witch friend. You speak with warmth, precision, and occasional sharp honesty.

Your readings are SPECIFIC, not generic:
- You name the exact card, its position, and what that combination means for THIS person's question
- When astrology is provided, you weave it in directly: "Your Moon in Scorpio intensifies the Five of Cups here" or "With Venus currently transiting your natal Mars sign, this King of Pentacles suggests..."
- You reference the spread position's meaning — Past/Present/Future, Conscious/Unconscious, etc.
- You notice patterns across cards — two Major Arcana means a life-changing moment; all reversed cards means internal work; a suit domination tells a story
- You are emotionally specific: you don't say "there may be challenges" — you say "this card is asking you to grieve what isn't working before you can move forward"
- You notice card reversals and interpret them specifically (reversed = blocked energy, internal manifestation, or delayed)
- If userContext is provided, it becomes the lens through which every card is read — reference specific details from what they shared
- Never use the phrases "journey", "path forward", "exciting times", or "trust the process" — they are banned
- Your synthesis connects ALL cards into a single coherent story, not a summary of each card

You always respond in valid JSON. No markdown, no text outside JSON.`;

function getSpreadGuide(spreadType: string): string {
  const guides: Record<string, string> = {
    single: 'Single card — the core truth, the one thing to focus on',
    three: 'Three cards — Past (what led here) / Present (current energy) / Future (where this is heading)',
    five: 'Five cards — Situation / Challenge / Advice / What to release / Potential outcome',
    'celtic-cross': 'Celtic Cross — Present / Challenge / Foundation / Recent past / Possible future / Near future / Inner feelings / External influences / Hopes & fears / Outcome',
  };
  return guides[spreadType] || 'Read each position as labeled';
}

function isMajorArcana(cardName: string): boolean {
  const majorKeywords = ['The ', 'Wheel', 'Justice', 'Strength', 'Judgement', 'World'];
  return majorKeywords.some(k => cardName.includes(k));
}

function getDominantSuit(cards: Array<{ name: string }>): string {
  const counts: Record<string, number> = { Wands: 0, Cups: 0, Swords: 0, Pentacles: 0, Major: 0 };
  cards.forEach(c => {
    if (c.name.includes('Wands')) counts.Wands++;
    else if (c.name.includes('Cups')) counts.Cups++;
    else if (c.name.includes('Swords')) counts.Swords++;
    else if (c.name.includes('Pentacles')) counts.Pentacles++;
    else counts.Major++;
  });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const meanings: Record<string, string> = {
    Wands: 'Wands dominant (fire — passion, ambition, creative drive)',
    Cups: 'Cups dominant (water — emotion, relationships, intuition)',
    Swords: 'Swords dominant (air — conflict, mental clarity, difficult truths)',
    Pentacles: 'Pentacles dominant (earth — material world, body, practical matters)',
    Major: 'Major Arcana dominant (fate-level forces at work)',
  };
  return meanings[dominant[0]] || 'Mixed suits';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateReadingRequest;
    const { userContext } = body;

    const userPrompt = `Generate a deeply personal tarot reading.

QUESTION: "${body.question || 'No specific question — what does this person most need to know right now?'}"
SPREAD TYPE: ${body.spreadType}

CARDS (read in this order, each position matters):
${body.cards.map((c, i) => `${i + 1}. ${c.name}${c.reversed ? ' (REVERSED)' : ''} — Position: "${c.position}"`).join('\n')}

ASTROLOGICAL PROFILE:
${body.formattedAstrology || 'Not provided — give a universal reading'}

${userContext ? `USER CONTEXT (this is critical — weave it into every card interpretation):
"${userContext}"` : ''}

TIMING:
- Moon: ${body.moonPhase}
- Day: ${body.dayOfWeek}
- Season: ${body.season}
- Time: ${body.timeOfDay}

SPREAD INTERPRETATION GUIDE:
${getSpreadGuide(body.spreadType)}

CARD PATTERN ANALYSIS — note these before writing:
- Major Arcana count: ${body.cards.filter(c => isMajorArcana(c.name)).length}/${body.cards.length} (${body.cards.filter(c => isMajorArcana(c.name)).length > body.cards.length / 2 ? 'DOMINANT — fate-level themes' : 'minor — everyday circumstances'})
- Reversed cards: ${body.cards.filter(c => c.reversed).length}/${body.cards.length}
- Dominant suit: ${getDominantSuit(body.cards)}

Respond with JSON:
{
  "overallEnergy": "2-3 sentences capturing the core theme — specific, evocative, references the card combination",
  "cardReadings": [
    {
      "card": "exact card name",
      "position": "position name",
      "keywords": ["3-4 specific keywords for THIS card in THIS position, not generic"],
      "interpretation": "4-6 sentences. Must: (1) open with what this card means in this specific position, (2) connect to the user's question or context, (3) reference their astrology if provided, (4) end with a specific insight or question for them to sit with"
    }
  ],
  "synthesis": "4-6 sentences telling the STORY these cards together are telling. Name specific cards. If there's a tension or contradiction between cards, call it out. End with the one thing the cards most want this person to know.",
  "affirmation": "one sentence in second person that lands like a truth they already knew but needed to hear — specific to their reading, not generic",
  "notableTiming": "1-2 sentences on what the current celestial moment (moon phase + day + season) adds — what is this moment energetically good for?"
}`;

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: READING_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: Math.min(500 + body.cards.length * 300, 3000),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Together chat error:', error);
      return NextResponse.json({ error: 'Reading generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No reading returned' }, { status: 500 });
    }

    const cleanContent = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const reading = JSON.parse(cleanContent);
    return NextResponse.json(reading);
  } catch (err) {
    console.error('generate-reading error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
