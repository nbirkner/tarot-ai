import { NextRequest, NextResponse } from 'next/server';
import { CARD_PROMPTS } from '../../../data/card-prompts';
import { OSHO_ZEN_PROMPTS } from '../../../data/osho-zen-prompts';
import { STYLE_MODIFIERS } from '../../../data/style-modifiers';
import {
  IMAGE_HEIGHT,
  IMAGE_MODEL,
  IMAGE_PRICE_USD,
  IMAGE_STEPS,
  IMAGE_WIDTH,
  imageFailureIsTerminal,
} from '../../../lib/images';
import { readingLimitResponse } from '../../../lib/reading-quota';
import { GenerateCardRequest } from '../../../lib/types';
import { describeTogetherFailure, logTogetherFailure, type TogetherFailure } from '../../../lib/together';

export const maxDuration = 60;

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY!;

type ImageResult =
  | { ok: true; imageUrl: string }
  | { ok: false; failure: TogetherFailure };

async function requestImage(
  prompt: string,
  referenceImage?: string,
): Promise<ImageResult> {
  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      negative_prompt:
        'nudity, nude, naked, bare skin, exposed chest, breasts, cleavage, topless, shirtless, underwear, lingerie, sexual, suggestive, nsfw, explicit, revealing clothing',
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      steps: IMAGE_STEPS,
      n: 1,
      ...(referenceImage ? { reference_images: [referenceImage] } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    const failure = describeTogetherFailure('generate-card', IMAGE_MODEL, response.status, error);
    logTogetherFailure(failure);
    return { ok: false, failure };
  }

  const data = await response.json();
  const imageUrl = data.data?.[0]?.url;
  if (!imageUrl) {
    return {
      ok: false,
      failure: {
        scope: 'generate-card',
        model: IMAGE_MODEL,
        status: 502,
        providerCode: null,
        providerMessage: 'No image returned',
      },
    };
  }
  return { ok: true, imageUrl };
}

export async function POST(req: NextRequest) {
  const limited = await readingLimitResponse(req, 'image');
  if (limited) return limited;

  try {
    const body: GenerateCardRequest = await req.json();
    const { cardName, deckStyle, userPhotoBase64 } = body;

    const promptTable = deckStyle === 'osho-zen' ? OSHO_ZEN_PROMPTS : CARD_PROMPTS;
    const basePrompt = promptTable[cardName];
    if (!basePrompt) {
      return NextResponse.json({ error: `Unknown card: ${cardName}` }, { status: 400 });
    }

    const styleModifier = STYLE_MODIFIERS[deckStyle];
    const safetyPrefix = 'Safe for work, family-friendly tarot illustration. All figures fully clothed in robes, garments, or costumes. No exposed skin below the neck. No nudity, no bare chests, no cleavage, no suggestive poses. ';
    const borderStyle = deckStyle === 'osho-zen'
      ? 'Simple elegant border with subtle geometric accents.'
      : 'Ornate decorative tarot card border with corner flourishes.';
    const titleStyle = deckStyle === 'osho-zen'
      ? `Card title "${cardName}" at the bottom in elegant serif lettering.`
      : `Card title "${cardName.toUpperCase()}" at the bottom in gothic serif lettering.`;
    let fullPrompt = `${safetyPrefix}${basePrompt} ${styleModifier}. ${borderStyle} ${titleStyle} High detail illustration.`;

    if (userPhotoBase64) {
      fullPrompt += ' Use the reference photo for the faces and appearance of the human figures in this card — if the reference shows one person apply them to the card\'s main figure, if multiple people are shown distribute them naturally across the card\'s figures. Keep all symbolic objects, animals, landscapes, and celestial elements unchanged. All figures must be fully clothed and tasteful.';
      try {
        const withPhoto = await requestImage(fullPrompt, userPhotoBase64);
        if (withPhoto.ok) {
          return NextResponse.json({ imageUrl: withPhoto.imageUrl, estimatedCost: IMAGE_PRICE_USD });
        }
        if (imageFailureIsTerminal(withPhoto.failure.providerCode)) {
          return NextResponse.json(
            {
              error: 'Image generation failed',
              providerStatus: withPhoto.failure.status,
              providerCode: withPhoto.failure.providerCode,
            },
            { status: 500 },
          );
        }
        console.error('generate-card: reference photo was rejected, drawing the card without it');
      } catch (photoErr) {
        console.error('generate-card: reference photo request failed, drawing the card without it', photoErr instanceof Error ? photoErr.name : 'Error');
      }
    }

    const drawn = await requestImage(fullPrompt);
    if (!drawn.ok) {
      return NextResponse.json(
        {
          error: 'Image generation failed',
          providerStatus: drawn.failure.status,
          providerCode: drawn.failure.providerCode,
        },
        { status: drawn.failure.status === 502 ? 500 : drawn.failure.status >= 400 ? drawn.failure.status : 500 },
      );
    }

    return NextResponse.json({ imageUrl: drawn.imageUrl, estimatedCost: IMAGE_PRICE_USD });
  } catch (err) {
    console.error('generate-card error:', err instanceof Error ? err.name : 'Error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
