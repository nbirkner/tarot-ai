import { NextRequest, NextResponse } from 'next/server';
import { CARD_PROMPTS } from '../../../data/card-prompts';
import { OSHO_ZEN_PROMPTS } from '../../../data/osho-zen-prompts';
import { STYLE_MODIFIERS } from '../../../data/style-modifiers';
import { buildCardImagePrompt } from '../../../lib/card-art';
import {
  cardArtCacheKey,
  claimCardArt,
  readCardArt,
  releaseCardArt,
  rememberCardArt,
} from '../../../lib/image-cache';
import {
  IMAGE_MODEL,
  IMAGE_PRICE_USD,
  imageFailureIsTerminal,
  imageRequestBody,
} from '../../../lib/images';
import { describePortrait } from '../../../lib/portrait';
import { readingLimitResponse, takeSpend } from '../../../lib/reading-quota';
import { normalizeReadingId } from '../../../lib/rate-limit';
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
      'User-Agent': 'tarot-ai',
    },
    body: JSON.stringify(imageRequestBody(prompt, referenceImage)),
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

    const cacheKey = cardArtCacheKey({
      readingId: normalizeReadingId(req.headers.get('x-reading-id')),
      deckStyle,
      cardName,
      photo: userPhotoBase64,
    });
    const cached = await readCardArt(cacheKey);
    if (cached) {
      return NextResponse.json({ imageUrl: cached, estimatedCost: 0 });
    }

    const lockKey = `${cacheKey}:lock`;
    const claimed = await claimCardArt(lockKey);
    try {
      if (!claimed) {
        for (let attempt = 0; attempt < 80; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const ready = await readCardArt(cacheKey);
          if (ready) {
            return NextResponse.json({ imageUrl: ready, estimatedCost: 0 });
          }
        }
      }

      const styleModifier = STYLE_MODIFIERS[deckStyle];
      let portrait: string | undefined;

      // The face photo is forwarded to Together for this request only.
      // It is not written to Redis, disk, logs, or the saved reading.
      // Kontext accepts it as image_url. This account blocks that handoff,
      // so a refused photo is described by the vision model and drawn as text.
      if (userPhotoBase64) {
        const withReference = await takeSpend(IMAGE_REFERENCE_PRICE_MICRODOLLARS);
        if (!withReference.ok) return withReference.response;
        const photoPrompt = buildCardImagePrompt({
          symbolism: basePrompt,
          deckTheme: styleModifier,
          portrait: 'the person in the reference photo',
        });
        try {
          const withPhoto = await requestImage(
            `${photoPrompt} Use the reference photo for the face and appearance of the human figures. Keep the symbolic objects. All figures stay fully clothed.`,
            userPhotoBase64,
          );
          if (withPhoto.ok) {
            await withReference.settle(IMAGE_REFERENCE_PRICE_MICRODOLLARS);
            await rememberCardArt(cacheKey, withPhoto.imageUrl);
            return NextResponse.json({ imageUrl: withPhoto.imageUrl, estimatedCost: IMAGE_PRICE_USD });
          }
          await withReference.settle(0);
          if (withPhoto.failure.status === 401) return imageFailureResponse(withPhoto.failure);
          if (imageFailureIsTerminal(withPhoto.failure.providerCode)) {
            console.error('generate-card: reference photo was refused, describing the person instead');
          } else {
            console.error('generate-card: reference photo was rejected, describing the person instead');
          }
        } catch (photoErr) {
          await withReference.settle(0);
          console.error(
            'generate-card: reference photo request failed, describing the person instead',
            photoErr instanceof Error ? photoErr.name : 'Error',
          );
        }

        const described = await describePortrait(userPhotoBase64);
        if (!described.ok) return described.response;
        if (described.description) portrait = described.description;
      }

      const fullPrompt = buildCardImagePrompt({
        symbolism: basePrompt,
        deckTheme: styleModifier,
        portrait,
      });

      const drawnSpend = await takeSpend(IMAGE_PRICE_MICRODOLLARS);
      if (!drawnSpend.ok) return drawnSpend.response;
      try {
        const drawn = await requestImage(fullPrompt);
        if (!drawn.ok) {
          await drawnSpend.settle(0);
          return imageFailureResponse(drawn.failure);
        }
        await drawnSpend.settle(IMAGE_PRICE_MICRODOLLARS);
        await rememberCardArt(cacheKey, drawn.imageUrl);
        return NextResponse.json({ imageUrl: drawn.imageUrl, estimatedCost: IMAGE_PRICE_USD });
      } catch (err) {
        await drawnSpend.settle(0);
        throw err;
      }
    } finally {
      if (claimed) await releaseCardArt(lockKey);
    }
  } catch (err) {
    console.error('generate-card error:', err instanceof Error ? err.name : 'Error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
