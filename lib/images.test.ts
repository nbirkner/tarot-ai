import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildCardImagePrompt } from './card-art.ts';
import { cardArtCacheKey, photoCacheTag } from './image-cache.ts';
import {
  IMAGE_ASPECT_RATIO,
  IMAGE_HEIGHT,
  IMAGE_MODEL,
  IMAGE_PRICE_MICRODOLLARS,
  IMAGE_PRICE_USD,
  IMAGE_WIDTH,
  RETIRED_IMAGE_MODELS,
  imageFailureIsTerminal,
  imageRequestBody,
} from './images.ts';
import { STYLE_MODIFIERS } from '../data/style-modifiers.ts';
import { CARD_PROMPTS } from '../data/card-prompts.ts';

describe('card image model', () => {
  it('uses FLUX.1 Kontext pro, which this account can call', () => {
    assert.equal(IMAGE_MODEL, 'black-forest-labs/FLUX.1-kontext-pro');
    for (const retired of RETIRED_IMAGE_MODELS) {
      assert.notEqual(IMAGE_MODEL, retired);
    }
    assert.equal(IMAGE_ASPECT_RATIO, '2:3');
    assert.equal(IMAGE_WIDTH, 832);
    assert.equal(IMAGE_HEIGHT, 1248);
    assert.equal(IMAGE_PRICE_MICRODOLLARS, 41533);
    assert.equal(IMAGE_PRICE_USD, 0.041533);
  });

  it('asks Kontext for a portrait and a reference photo, not a step count', () => {
    const plain = imageRequestBody('a sun');
    assert.equal(plain.aspect_ratio, '2:3');
    assert.equal(plain.response_format, 'url');
    assert.equal('steps' in plain, false);
    assert.equal('width' in plain, false);
    assert.equal('reference_images' in plain, false);
    assert.equal('image_url' in plain, false);

    const photo = imageRequestBody('a sun', 'data:image/jpeg;base64,abc');
    assert.equal(photo.image_url, 'data:image/jpeg;base64,abc');
    assert.equal('reference_images' in photo, false);
  });

  it('does not retry a photo-less call when the model itself is blocked', () => {
    assert.equal(imageFailureIsTerminal('model_not_available'), true);
    assert.equal(imageFailureIsTerminal('third_party_data_sharing_blocked'), true);
    assert.equal(imageFailureIsTerminal(null), false);
    assert.equal(imageFailureIsTerminal('invalid_request_error'), false);
  });

  it('combines the deck theme, the traditional scene, and the house style', () => {
    const prompt = buildCardImagePrompt({
      symbolism: CARD_PROMPTS['The Lovers'],
      deckTheme: STYLE_MODIFIERS.classic,
    });
    assert.match(prompt, /Neo-Grimoire/);
    assert.match(prompt, /ember orange/);
    assert.match(prompt, /classic tarot illustration style/);
    assert.match(prompt, /Two figures stand beneath an angel/);
    assert.match(prompt, /No letters/);
    assert.doesNotMatch(prompt, /Card title/);
    assert.doesNotMatch(prompt, /\u2014/);
  });

  it('keeps a photo out of the cache key', () => {
    const photo = `data:image/jpeg;base64,${'C'.repeat(80)}`;
    const key = cardArtCacheKey({
      readingId: 'reading-1',
      deckStyle: 'classic',
      cardName: 'The World',
      photo,
    });
    assert.equal(key.includes(photo), false);
    assert.equal(key.includes('data:image'), false);
    assert.match(key, /The%20World/);
    assert.notEqual(photoCacheTag(photo), photoCacheTag(`${photo}x`));
    assert.equal(
      cardArtCacheKey({ readingId: 'reading-1', deckStyle: 'classic', cardName: 'The World' }),
      cardArtCacheKey({ readingId: 'reading-1', deckStyle: 'classic', cardName: 'The World' }),
    );
  });
});
