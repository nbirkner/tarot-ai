import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CARD_READING_MAX_TOKENS,
  CHAT_MODEL,
  FOLLOWUP_MAX_TOKENS,
  RETIRED_SERVERLESS_CHAT_MODEL,
  SYNTHESIS_MAX_TOKENS,
  chatCompletionBody,
  describeTogetherFailure,
} from './together.ts';

describe('chat model', () => {
  it('does not call the retired Llama 4 Maverick serverless id', () => {
    assert.notEqual(CHAT_MODEL, RETIRED_SERVERLESS_CHAT_MODEL);
    assert.equal(CHAT_MODEL, 'meta-models/Muse-Glimmer-30B');
  });

  it('leaves enough completion tokens for JSON after reasoning', () => {
    assert.ok(CARD_READING_MAX_TOKENS >= 1000);
    assert.ok(SYNTHESIS_MAX_TOKENS >= CARD_READING_MAX_TOKENS);
    assert.ok(FOLLOWUP_MAX_TOKENS >= 800);
  });

  it('asks Muse not to spend the budget on hidden reasoning', () => {
    const body = chatCompletionBody({
      messages: [{ role: 'user', content: 'hi' }],
      temperature: 0.85,
      maxTokens: CARD_READING_MAX_TOKENS,
      stream: true,
    });
    assert.equal(body.model, CHAT_MODEL);
    assert.equal(body.max_tokens, CARD_READING_MAX_TOKENS);
    assert.equal(body.stream, true);
    assert.deepEqual(body.reasoning, { enabled: false });
  });
});

describe('describeTogetherFailure', () => {
  it('surfaces the model_not_available error from a retired model', () => {
    const body = JSON.stringify({
      error: {
        message:
          'Unable to access non-serverless model meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8. Please visit https://api.together.ai/models/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8 to create and start a new dedicated endpoint for the model.',
        type: 'invalid_request_error',
        code: 'model_not_available',
      },
    });
    const failure = describeTogetherFailure(
      'generate-card-reading',
      RETIRED_SERVERLESS_CHAT_MODEL,
      400,
      body,
    );
    assert.equal(failure.scope, 'generate-card-reading');
    assert.equal(failure.status, 400);
    assert.equal(failure.providerCode, 'model_not_available');
    assert.match(failure.providerMessage, /Unable to access non-serverless model/);
    assert.doesNotMatch(failure.providerMessage, /Bearer /);
  });

  it('keeps a truncated plain-text body when the provider does not return JSON', () => {
    const failure = describeTogetherFailure(
      'generate-card',
      'black-forest-labs/FLUX.1-schnell',
      500,
      'bad gateway\nplease retry',
    );
    assert.equal(failure.providerCode, null);
    assert.equal(failure.providerMessage, 'bad gateway please retry');
  });
});
