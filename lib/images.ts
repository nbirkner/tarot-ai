/**
 * Card art model.
 *
 * `Rundiffusion/Juggernaut-Lightning-Flux` returns 403
 * `third_party_data_sharing_blocked` on this account. Qwen-Image is served
 * by Together. Width and height are multiples of 8. 28 steps is the step
 * count in Together's Qwen-Image example, so the request stays on the
 * published default price instead of the extra-step surcharge.
 *
 * Catalog price is $0.0058 per image at that default:
 * https://www.together.ai/models/qwen-image
 */
export const IMAGE_MODEL = 'Qwen/Qwen-Image';

export const IMAGE_PRICE_USD = 0.0058;

export const IMAGE_WIDTH = 768;
export const IMAGE_HEIGHT = 1024;
export const IMAGE_STEPS = 28;

export const RETIRED_IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'black-forest-labs/FLUX.1-kontext-pro',
  'Rundiffusion/Juggernaut-Lightning-Flux',
] as const;

/** Failures that will not change if the same model is called again without a photo. */
export function imageFailureIsTerminal(providerCode: string | null): boolean {
  return providerCode === 'model_not_available' || providerCode === 'third_party_data_sharing_blocked';
}
