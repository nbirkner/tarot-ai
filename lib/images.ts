/**
 * Card art model.
 *
 * Per-image models such as Qwen-Image and Juggernaut Flux are forwarded to
 * another provider. This account rejects that with 403
 * `third_party_data_sharing_blocked`, and the client then paints the shared
 * diamond placeholder. FLUX.1 Kontext [pro] is served by Together on this key.
 *
 * Kontext sizes with `aspect_ratio`, not width and height. `2:3` comes back
 * as 832×1248. Catalog price is $0.04 per megapixel:
 * https://www.together.ai/models/flux-1-kontext-pro
 * 832 * 1248 * 0.04 / 1_000_000 = $0.041533
 */
export const IMAGE_MODEL = 'black-forest-labs/FLUX.1-kontext-pro';

/** Portrait ratio of a tarot card. Kontext does not take width and height. */
export const IMAGE_ASPECT_RATIO = '2:3';

/** Measured output of FLUX.1 Kontext [pro] at aspect_ratio 2:3. */
export const IMAGE_WIDTH = 832;
export const IMAGE_HEIGHT = 1248;

/** Dollars per output megapixel. Steps are omitted so the call stays on this rate. */
export const IMAGE_USD_PER_MEGAPIXEL = 0.04;

export const IMAGE_PRICE_MICRODOLLARS = Math.round((IMAGE_WIDTH * IMAGE_HEIGHT * 4) / 100);

export const IMAGE_PRICE_USD = IMAGE_PRICE_MICRODOLLARS / 1_000_000;

export const RETIRED_IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'black-forest-labs/FLUX.1.1-pro',
  'black-forest-labs/FLUX.2-dev',
  'Rundiffusion/Juggernaut-Lightning-Flux',
  'Qwen/Qwen-Image',
] as const;

export function imageRequestBody(prompt: string, referenceImage?: string) {
  return {
    model: IMAGE_MODEL,
    prompt,
    aspect_ratio: IMAGE_ASPECT_RATIO,
    n: 1,
    response_format: 'url' as const,
    ...(referenceImage ? { image_url: referenceImage } : {}),
  };
}

/** Failures that will not change if the same model is called again without a photo. */
export function imageFailureIsTerminal(providerCode: string | null): boolean {
  return providerCode === 'model_not_available' || providerCode === 'third_party_data_sharing_blocked';
}
