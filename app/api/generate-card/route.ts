import { NextRequest, NextResponse } from 'next/server';
import { CARD_PROMPTS } from '../../../data/card-prompts';
import { OSHO_ZEN_PROMPTS } from '../../../data/osho-zen-prompts';
import { STYLE_MODIFIERS } from '../../../data/style-modifiers';
import { GenerateCardRequest } from '../../../lib/types';

export const maxDuration = 60;

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;
const IMAGE_MODEL_SCHNELL = 'black-forest-labs/FLUX.1-schnell';
const IMAGE_MODEL_KONTEXT = 'black-forest-labs/FLUX.1-kontext-pro';

export async function POST(req: NextRequest) {
  try {
    const body: GenerateCardRequest = await req.json();
    const { cardName, deckStyle, userPhotoBase64 } = body;

    const promptTable = deckStyle === 'osho-zen' ? OSHO_ZEN_PROMPTS : CARD_PROMPTS;
    const basePrompt = promptTable[cardName];
    if (!basePrompt) {
      return NextResponse.json({ error: `Unknown card: ${cardName}` }, { status: 400 });
    }

    const styleModifier = STYLE_MODIFIERS[deckStyle];
    const safetyPrefix = 'Safe, tasteful, fully clothed, family-friendly tarot illustration. ';
    const borderStyle = deckStyle === 'osho-zen'
      ? 'Simple elegant border with subtle geometric accents.'
      : 'Ornate decorative tarot card border with corner flourishes.';
    const titleStyle = deckStyle === 'osho-zen'
      ? `Card title "${cardName}" at the bottom in elegant serif lettering.`
      : `Card title "${cardName.toUpperCase()}" at the bottom in gothic serif lettering.`;
    let fullPrompt = `${safetyPrefix}${basePrompt} ${styleModifier}. ${borderStyle} ${titleStyle} High detail illustration.`;

    if (userPhotoBase64) {
      // Try FLUX.1-kontext-pro with the reference photo
      fullPrompt += ' Apply the faces and appearance of the people in the reference photo to the human figures in this card — if the reference shows one person apply them to the card\'s main figure, if multiple people are shown distribute them naturally across the card\'s figures. Keep all symbolic objects, animals, landscapes, and celestial elements unchanged. All figures must be fully clothed and tasteful.';

      try {
        const kontextResponse = await fetch('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${TOGETHER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: IMAGE_MODEL_KONTEXT,
            prompt: fullPrompt,
            image_url: userPhotoBase64,
            width: 512,
            height: 768,
            steps: 28,
            n: 1,
          }),
        });

        if (kontextResponse.ok) {
          const kontextData = await kontextResponse.json();
          const imageUrl = kontextData.data?.[0]?.url;
          if (imageUrl) {
            return NextResponse.json({ imageUrl, estimatedCost: 0.004 });
          }
        } else {
          const errText = await kontextResponse.text();
          console.error('Kontext API error, falling back to schnell:', errText);
        }
      } catch (kontextErr) {
        console.error('Kontext request failed, falling back to schnell:', kontextErr);
      }

      // Fall through to schnell below if kontext failed
    }

    // Default: FLUX.1-schnell (no photo, or kontext fallback)
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL_SCHNELL,
        prompt: fullPrompt,
        width: 512,
        height: 768,
        steps: 4,
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
