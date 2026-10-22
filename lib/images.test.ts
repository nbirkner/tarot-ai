import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { IMAGE_MODEL, IMAGE_PRICE_USD, RETIRED_IMAGE_MODELS, imageFailureIsTerminal } from './images.ts';

describe('card image model', () => {
  it('uses a current Together serverless model instead of the retired FLUX ids', () => {
    assert.equal(IMAGE_MODEL, 'Rundiffusion/Juggernaut-Lightning-Flux');
    for (const retired of RETIRED_IMAGE_MODELS) {
      assert.notEqual(IMAGE_MODEL, retired);
    }
    assert.equal(IMAGE_PRICE_USD, 0.0017);
  });

  it('does not retry a photo-less call when the model itself is blocked', () => {
    assert.equal(imageFailureIsTerminal('model_not_available'), true);
    assert.equal(imageFailureIsTerminal('third_party_data_sharing_blocked'), true);
    assert.equal(imageFailureIsTerminal(null), false);
    assert.equal(imageFailureIsTerminal('invalid_request_error'), false);
  });
});
