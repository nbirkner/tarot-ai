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
import { readingLimitResponse, takeSpend } from '../../../lib/reading-quota';
import { IMAGE_PRICE_MICRODOLLARS, IMAGE_REFERENCE_PRICE_MICRODOLLARS } from '../../../lib/spend';
import type { GenerateCardRequest } from '../../../lib/types';
import {
  PROVIDER_BLOCKED_MESSAGE,
  describeTogetherFailure,
  logTogetherFailure,
  togetherRequestIsBlocked,
  type TogetherFailure,
} from '../../../lib/together';

export const maxDuration = 60;

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
      Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
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

function imageFailureResponse(failure: TogetherFailure) {
  if (togetherRequestIsBlocked(failure.status, failure.providerCode)) {
    return NextResponse.json(
      { error: PROVIDER_BLOCKED_MESSAGE, providerCode: failure.providerCode },
      { status: 403 },
    );
  }
  return NextResponse.json(
    {
      error: 'Image generation failed',
      providerStatus: failure.status,
      providerCode: failure.providerCode,
    },
    { status: failure.status === 502 ? 500 : failure.status >= 400 ? failure.status : 500 },
  );
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

    // The face photo is forwarded to Together as a reference image for this
    // request only. It is not written to Redis, disk, logs, or the saved reading.
    if (userPhotoBase64) {
      fullPrompt += ' Use the reference photo for the faces and appearance of the human figures in this card — if the reference shows one person apply them to the card\'s main figure, if multiple people are shown distribute them naturally across the card\'s figures. Keep all symbolic objects, animals, landscapes, and celestial elements unchanged. All figures must be fully clothed and tasteful.';
      const withReference = await takeSpend(IMAGE_REFERENCE_PRICE_MICRODOLLARS);
      if (!withReference.ok) return withReference.response;
      try {
        const withPhoto = await requestImage(fullPrompt, userPhotoBase64);
        if (withPhoto.ok) {
          await withReference.settle(IMAGE_REFERENCE_PRICE_MICRODOLLARS);
          return NextResponse.json({ imageUrl: withPhoto.imageUrl, estimatedCost: IMAGE_PRICE_USD });
        }
        await withReference.settle(0);
        if (imageFailureIsTerminal(withPhoto.failure.providerCode)) {
          return imageFailureResponse(withPhoto.failure);
        }
        console.error('generate-card: reference photo was rejected, drawing the card without it');
      } catch (photoErr) {
        await withReference.settle(0);
        console.error('generate-card: reference photo request failed, drawing the card without it', photoErr instanceof Error ? photoErr.name : 'Error');
      }
    }

    const drawnSpend = await takeSpend(IMAGE_PRICE_MICRODOLLARS);
    if (!drawnSpend.ok) return drawnSpend.response;
    try {
      const drawn = await requestImage(fullPrompt);
      if (!drawn.ok) {
        await drawnSpend.settle(0);
        return imageFailureResponse(drawn.failure);
      }
      await drawnSpend.settle(IMAGE_PRICE_MICRODOLLARS);
      return NextResponse.json({ imageUrl: drawn.imageUrl, estimatedCost: IMAGE_PRICE_USD });
    } catch (err) {
      await drawnSpend.settle(0);
      throw err;
    }
  } catch (err) {
    console.error('generate-card error:', err instanceof Error ? err.name : 'Error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
