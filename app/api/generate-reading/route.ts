import { NextRequest, NextResponse } from 'next/server';
import { GenerateReadingRequest } from '../../../lib/types';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;
const READING_MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo';

const SYSTEM_PROMPT = `You are an experienced, intuitive tarot reader — warm, direct, and insightful. Think of yourself as the user's trusted witch friend who has studied tarot and astrology deeply for many years.

Your readings are:
- Specific, not generic. Reference the exact cards, their positions, the user's question, and contextual details.
- Emotionally honest. Validate feelings first, then offer perspective.
- Occasionally challenging. Gently push back when cards suggest the user may not be seeing something clearly.
- Never vague. Phrases like "energy is shifting" are lazy — always ground the reading in specific card symbolism and context.

You always respond in valid JSON matching the schema provided. No markdown, no extra text outside the JSON.`;

export async function POST(req: NextRequest) {
  try {
    const body: GenerateReadingRequest = await req.json();

    const userPrompt = `Generate a tarot reading with this context:

Question: "${body.question || 'No specific question — general guidance'}"
Spread: ${body.spreadType}
Cards drawn:
${body.cards.map((c) => `- ${c.name}${c.reversed ? ' (reversed)' : ''} in position: ${c.position}`).join('\n')}

Astrology context: ${body.formattedAstrology || 'Not provided'}
Moon phase: ${body.moonPhase}
Day: ${body.dayOfWeek}
Season: ${body.season}
Time of day: ${body.timeOfDay}

Respond with JSON matching this exact schema:
{
  "overallEnergy": "2-3 sentences on the reading's overarching theme",
  "cardReadings": [
    {
      "card": "card name",
      "position": "position name",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "interpretation": "3-5 sentences woven with the user's question and context"
    }
  ],
  "synthesis": "3-5 sentences synthesizing all cards into unified guidance",
  "affirmation": "one powerful sentence the user can carry with them",
  "notableTiming": "1-2 sentences on what the moon phase, day, or season adds to this reading"
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
        response_format: { type: 'json_object' },
        temperature: 0.85,
        max_tokens: 2500,
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

    const reading = JSON.parse(content);

    // Cost estimate: ~2500 tokens at $0.88/1M = ~$0.0022
    const estimatedCost = 0.0022;

    return NextResponse.json({ ...reading, estimatedCost });
  } catch (err) {
    console.error('generate-reading error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
