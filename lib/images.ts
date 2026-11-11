/**
 * Card art model.
 *
 * Models billed per image (Juggernaut, Qwen-Image, FLUX.2 dev) are
 * passthroughs. This organization rejects them with 403
 * `third_party_data_sharing_blocked`. FLUX.1.1 [pro] is billed per
 * megapixel on Together's own rate: $0.04 per MP. A 768×1024 card is
 * 0.786432 MP, so one image is $0.031457. Steps stay at the catalog
 * default band (28) and both sides are multiples of 8.
 */
export const IMAGE_MODEL = 'black-forest-labs/FLUX.1.1-pro';

export const IMAGE_PRICE_USD = 0.031457;

export const IMAGE_WIDTH = 768;
export const IMAGE_HEIGHT = 1024;
export const IMAGE_STEPS = 28;

export const RETIRED_IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'black-forest-labs/FLUX.1-kontext-pro',
  'Rundiffusion/Juggernaut-Lightning-Flux',
  'Qwen/Qwen-Image',
  'black-forest-labs/FLUX.2-dev',
] as const;

/** Failures that will not change if the same model is called again without a photo. */
export function imageFailureIsTerminal(providerCode: string | null): boolean {
  return providerCode === 'model_not_available' || providerCode === 'third_party_data_sharing_blocked';
}
