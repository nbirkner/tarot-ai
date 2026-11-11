/**
 * Card art model.
 *
 * Juggernaut Lightning Flux and Qwen-Image both return 403
 * `third_party_data_sharing_blocked`: Together forwards those prompts to
 * another provider, and this organization has that sharing turned off.
 * FLUX.2 [dev] is the open-weight serverless model Together runs itself.
 * 768×1024 is a portrait multiple of 8. 28 steps matches Together's
 * FLUX.2 [dev] example, which is the published $0.0154 image price.
 */
export const IMAGE_MODEL = 'black-forest-labs/FLUX.2-dev';

export const IMAGE_PRICE_USD = 0.0154;

export const IMAGE_WIDTH = 768;
export const IMAGE_HEIGHT = 1024;
export const IMAGE_STEPS = 28;

export const RETIRED_IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'black-forest-labs/FLUX.1-kontext-pro',
  'Rundiffusion/Juggernaut-Lightning-Flux',
  'Qwen/Qwen-Image',
] as const;

/** Failures that will not change if the same model is called again without a photo. */
export function imageFailureIsTerminal(providerCode: string | null): boolean {
  return providerCode === 'model_not_available' || providerCode === 'third_party_data_sharing_blocked';
}
