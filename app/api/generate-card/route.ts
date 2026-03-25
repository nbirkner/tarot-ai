import { NextRequest, NextResponse } from 'next/server';
import { CARD_PROMPTS } from '../../../data/card-prompts';
import { STYLE_MODIFIERS } from '../../../data/style-modifiers';
import { GenerateCardRequest } from '../../../lib/types';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;
const IMAGE_MODEL = 'black-forest-labs/FLUX.1-schnell';
// Cost: ~$0.001 per 512x768 card at FLUX schnell pricing

function buildSeed(cardName: string, userId: string, date: string): number {
  // Deterministic seed: same card + user + date = same image
  const str = `${cardName}:${userId}:${date}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateCardRequest = await req.json();
    const { cardName, deckStyle, userId, date } = body;

    const basePrompt = CARD_PROMPTS[cardName];
    if (!basePrompt) {
      return NextResponse.json({ error: `Unknown card: ${cardName}` }, { status: 400 });
    }

    const styleModifier = STYLE_MODIFIERS[deckStyle];
    const fullPrompt = `${basePrompt} ${styleModifier}. Ornate decorative tarot card border with corner flourishes. Card title "${cardName.toUpperCase()}" at the bottom in gothic serif lettering. High detail illustration.`;

    const seed = buildSeed(cardName, userId, date);

    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: fullPrompt,
        width: 512,
        height: 768,
        steps: 4,
        seed,
        n: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Together API error:', error);
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 });
    }

    // Cost estimate: 512*768 pixels = 393216 px = 0.393 megapixels
    // FLUX schnell: ~$0.003/MP = ~$0.00118 per card
    const estimatedCost = 0.0012;

    return NextResponse.json({ imageUrl, estimatedCost });
  } catch (err) {
    console.error('generate-card error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
