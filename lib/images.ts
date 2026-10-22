/**
 * Card art model.
 *
 * `black-forest-labs/FLUX.1-schnell` was removed from Together serverless
 * (`model_not_available`). `black-forest-labs/FLUX.1-kontext-pro` is still
 * listed, but this account cannot call it. The replacement is Juggernaut
 * Lightning Flux, a FLUX-based model on the current serverless catalog:
 * https://docs.together.ai/docs/serverless/models
 *
 * Catalog price is about $0.0017 per image (the provider's per-image charge;
 * it can vary). 512×768 at 4 steps matches the old card size.
 */
export const IMAGE_MODEL = 'Rundiffusion/Juggernaut-Lightning-Flux';

export const IMAGE_PRICE_USD = 0.0017;

export const IMAGE_WIDTH = 512;
export const IMAGE_HEIGHT = 768;
export const IMAGE_STEPS = 4;

export const RETIRED_IMAGE_MODELS = [
  'black-forest-labs/FLUX.1-schnell',
  'black-forest-labs/FLUX.1-kontext-pro',
] as const;

/** Failures that will not change if the same model is called again without a photo. */
export function imageFailureIsTerminal(providerCode: string | null): boolean {
  return providerCode === 'model_not_available' || providerCode === 'third_party_data_sharing_blocked';
}
