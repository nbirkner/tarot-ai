import { NextRequest, NextResponse } from 'next/server';
import { CARD_PROMPTS } from '../../../data/card-prompts';
import { OSHO_ZEN_PROMPTS } from '../../../data/osho-zen-prompts';
import { STYLE_MODIFIERS } from '../../../data/style-modifiers';
import { buildCardImagePrompt, safeSymbolicScene } from '../../../lib/card-art';
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
  imageFailureIsNsfw,
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

type PaidImage =
  | { ok: true; imageUrl: string }
  | { ok: false; response: NextResponse }
  | { ok: false; failure: TogetherFailure };

async function paidImage(prompt: string, referenceImage?: string): Promise<PaidImage> {
  const price = referenceImage ? IMAGE_REFERENCE_PRICE_MICRODOLLARS : IMAGE_PRICE_MICRODOLLARS;
  const spend = await takeSpend(price);
  if (!spend.ok) return { ok: false, response: spend.response };
  try {
    const drawn = await requestImage(prompt, referenceImage);
    if (!drawn.ok) {
      await spend.settle(0);
      return { ok: false, failure: drawn.failure };
    }
    await spend.settle(price);
    return { ok: true, imageUrl: drawn.imageUrl };
  } catch (err) {
    await spend.settle(0);
    throw err;
  }
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

      const saved = async (imageUrl: string) => {
        await rememberCardArt(cacheKey, imageUrl);
        return NextResponse.json({ imageUrl, estimatedCost: IMAGE_PRICE_USD });
      };

      // One extra image slot and one extra spend reservation. A second 422
      // is returned as-is so the card falls back to the placeholder.
      const symbolicRetry = async () => {
        const again = await readingLimitResponse(req, 'image');
        if (again) return again;
        const retry = await paidImage(
          buildCardImagePrompt({
            symbolism: safeSymbolicScene(cardName),
            deckTheme: styleModifier,
          }),
        );
        if (!retry.ok) {
          if ('response' in retry) return retry.response;
          return imageFailureResponse(retry.failure);
        }
        return saved(retry.imageUrl);
      };

      // The face photo is forwarded to Together for this request only.
      // It is not written to Redis, disk, logs, or the saved reading.
      // Kontext accepts it as image_url. This account blocks that handoff,
      // so a refused photo is described by the vision model and drawn as text.
      if (userPhotoBase64) {
        const photoPrompt = buildCardImagePrompt({
          symbolism: basePrompt,
          deckTheme: styleModifier,
          portrait: 'the person in the reference photo',
        });
        try {
          const withPhoto = await paidImage(
            `${photoPrompt} Use the reference photo for the face and appearance of the adult figures. Keep the symbolic objects. All figures stay fully clothed.`,
            userPhotoBase64,
          );
          if (withPhoto.ok) return saved(withPhoto.imageUrl);
          if ('response' in withPhoto) return withPhoto.response;
          if (withPhoto.failure.status === 401) return imageFailureResponse(withPhoto.failure);
          if (imageFailureIsNsfw(withPhoto.failure.status, withPhoto.failure.providerMessage)) {
            console.error('generate-card: picture was refused as unsafe, drawing a symbol instead');
            return symbolicRetry();
          }
          if (imageFailureIsTerminal(withPhoto.failure.providerCode)) {
            console.error('generate-card: reference photo was refused, describing the person instead');
          } else {
            console.error('generate-card: reference photo was rejected, describing the person instead');
          }
        } catch (photoErr) {
          console.error(
            'generate-card: reference photo request failed, describing the person instead',
            photoErr instanceof Error ? photoErr.name : 'Error',
          );
        }

        const described = await describePortrait(userPhotoBase64);
        if (!described.ok) return described.response;
        if (described.description) portrait = described.description;
      }

      const drawn = await paidImage(
        buildCardImagePrompt({
          symbolism: basePrompt,
          deckTheme: styleModifier,
          portrait,
        }),
      );
      if (!drawn.ok) {
        if ('response' in drawn) return drawn.response;
        if (imageFailureIsNsfw(drawn.failure.status, drawn.failure.providerMessage)) {
          console.error('generate-card: picture was refused as unsafe, drawing a symbol instead');
          return symbolicRetry();
        }
        return imageFailureResponse(drawn.failure);
      }
      return saved(drawn.imageUrl);
    } finally {
      if (claimed) await releaseCardArt(lockKey);
    }
  } catch (err) {
    console.error('generate-card error:', err instanceof Error ? err.name : 'Error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
