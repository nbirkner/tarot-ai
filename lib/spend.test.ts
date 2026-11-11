import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { afterEach, describe, it } from 'node:test';
import { billTogetherStream, usageFromSseBuffer } from './sse-usage.ts';
import {
  CHAT_CACHED_INPUT_USD_PER_MILLION,
  CHAT_INPUT_USD_PER_MILLION,
  CHAT_OUTPUT_USD_PER_MILLION,
  DEFAULT_DAILY_SPEND_CAP_CENTS,
  IMAGE_PRICE_MICRODOLLARS,
  IMAGE_REFERENCE_PRICE_MICRODOLLARS,
  MICRODOLLARS_PER_CENT,
  chatUsageMicrodollars,
  dailySpendCapMicrodollars,
  estimateChatMicrodollars,
  reserveDailySpend,
  setSpendRedisForTests,
  settleMicro,
  spendKey,
  type RedisEval,
} from './spend.ts';

declare module 'fengari' {
  // Test-only Lua VM. The package does not ship types.
  const fengari: any;
  export = fengari;
}

const require = createRequire(import.meta.url);
const fengari = require('fengari') as {
  lua: {
    LUA_OK: number;
    LUA_TNUMBER: number;
    LUA_TTABLE: number;
    lua_newtable: (L: unknown) => void;
    lua_pushcfunction: (L: unknown, fn: (state: unknown) => number) => void;
    lua_setfield: (L: unknown, index: number, name: Uint8Array) => void;
    lua_setglobal: (L: unknown, name: Uint8Array) => void;
    lua_pushstring: (L: unknown, value: Uint8Array) => void;
    lua_seti: (L: unknown, index: number, i: number) => void;
    lua_tostring: (L: unknown, index: number) => Uint8Array | null;
    lua_pushnil: (L: unknown) => void;
    lua_type: (L: unknown, index: number) => number;
    lua_tonumber: (L: unknown, index: number) => number;
    lua_geti: (L: unknown, index: number, i: number) => number;
    lua_pop: (L: unknown, n: number) => void;
  };
  lauxlib: {
    luaL_newstate: () => unknown;
    luaL_dostring: (L: unknown, code: Uint8Array) => number;
  };
  lualib: { luaL_openlibs: (L: unknown) => void };
  to_jsstring: (value: Uint8Array | null) => string;
  to_luastring: (value: string) => Uint8Array;
};
const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari;

type LuaRedis = {
  eval: RedisEval;
  store: Map<string, string>;
};

function createLuaRedis(): LuaRedis {
  const store = new Map<string, string>();

  function run(script: string, keys: string[], args: string[]): unknown {
    const L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(L);

    lua.lua_newtable(L);
    lua.lua_pushcfunction(L, (LL: unknown) => {
      const state = LL as typeof L;
      const cmd = to_jsstring(lua.lua_tostring(state, 1));
      const key = to_jsstring(lua.lua_tostring(state, 2));
      if (cmd === 'GET') {
        const value = store.get(key);
        if (value === undefined) lua.lua_pushnil(state);
        else lua.lua_pushstring(state, to_luastring(value));
        return 1;
      }
      if (cmd === 'SET') {
        store.set(key, to_jsstring(lua.lua_tostring(state, 3)));
        lua.lua_pushstring(state, to_luastring('OK'));
        return 1;
      }
      throw new Error(`unexpected redis command ${cmd}`);
    });
    lua.lua_setfield(L, -2, to_luastring('call'));
    lua.lua_setglobal(L, to_luastring('redis'));

    lua.lua_newtable(L);
    keys.forEach((key, index) => {
      lua.lua_pushstring(L, to_luastring(key));
      lua.lua_seti(L, -2, index + 1);
    });
    lua.lua_setglobal(L, to_luastring('KEYS'));

    lua.lua_newtable(L);
    args.forEach((arg, index) => {
      lua.lua_pushstring(L, to_luastring(arg));
      lua.lua_seti(L, -2, index + 1);
    });
    lua.lua_setglobal(L, to_luastring('ARGV'));

    const status = lauxlib.luaL_dostring(L, to_luastring(script));
    if (status !== lua.LUA_OK) {
      throw new Error(to_jsstring(lua.lua_tostring(L, -1)));
    }
    if (lua.lua_type(L, -1) === lua.LUA_TNUMBER) return lua.lua_tonumber(L, -1);
    if (lua.lua_type(L, -1) !== lua.LUA_TTABLE) {
      throw new Error('spend script did not return a number or table');
    }
    lua.lua_geti(L, -1, 1);
    const ok = lua.lua_tonumber(L, -1);
    lua.lua_pop(L, 1);
    lua.lua_geti(L, -1, 2);
    const spent = lua.lua_tonumber(L, -1);
    return [ok, spent];
  }

  return {
    store,
    eval(script, keys, args) {
      return Promise.resolve(run(script, keys, args));
    },
  };
}

const NOW = Date.parse('2026-11-11T12:00:00Z');

describe('daily spend cap', () => {
  const previousCap = process.env.TAROT_DAILY_SPEND_CAP_CENTS;
  let redis: LuaRedis;

  afterEach(() => {
    setSpendRedisForTests(null);
    if (previousCap === undefined) delete process.env.TAROT_DAILY_SPEND_CAP_CENTS;
    else process.env.TAROT_DAILY_SPEND_CAP_CENTS = previousCap;
  });

  function useRedis(cents: string) {
    process.env.TAROT_DAILY_SPEND_CAP_CENTS = cents;
    redis = createLuaRedis();
    setSpendRedisForTests(redis.eval);
  }

  it('uses a $2 default and the published Together rates', () => {
    assert.equal(DEFAULT_DAILY_SPEND_CAP_CENTS, 200);
    assert.equal(dailySpendCapMicrodollars(undefined), 200 * MICRODOLLARS_PER_CENT);
    assert.equal(dailySpendCapMicrodollars(''), 2_000_000);
    assert.equal(dailySpendCapMicrodollars('nope'), 0);
    assert.equal(CHAT_INPUT_USD_PER_MILLION, 0.17);
    assert.equal(CHAT_CACHED_INPUT_USD_PER_MILLION, 0.17);
    assert.equal(CHAT_OUTPUT_USD_PER_MILLION, 0.25);
    assert.equal(IMAGE_PRICE_MICRODOLLARS, 31457);
    assert.equal(IMAGE_REFERENCE_PRICE_MICRODOLLARS, 62914);
    // 2000 chars at 2 chars/token = 1000 input tokens, plus 1400 output tokens.
    // 1000 * 0.17 + 1400 * 0.25 = 520 microdollars.
    assert.equal(estimateChatMicrodollars(2000, 1400), 520);
    assert.equal(
      chatUsageMicrodollars({
        prompt_tokens: 1000,
        completion_tokens: 100,
        prompt_tokens_details: { cached_tokens: 800 },
      }),
      195,
    );
    assert.equal(settleMicro(100, { prompt_tokens: 100_000, completion_tokens: 100_000 }), 100);
    assert.equal(spendKey(NOW), 'tarot:spend:2026-11-11');
  });

  it('blocks the next call once the daily cap is reached', async () => {
    useRedis('0');
    const blocked = await reserveDailySpend(IMAGE_PRICE_MICRODOLLARS, NOW);
    assert.equal(blocked.ok, false);
    if (!blocked.ok) {
      assert.equal(blocked.reason, 'cap');
      assert.ok(blocked.retryAfterSeconds >= 1);
    }
    assert.equal(redis.store.get(spendKey(NOW)), undefined);
  });

  it('does not let concurrent reserves overshoot the cap', async () => {
    useRedis('1');
    const cap = 1 * MICRODOLLARS_PER_CENT;
    let highest = 0;
    const lua = createLuaRedis();
    setSpendRedisForTests(async (script, keys, args) => {
      const result = await lua.eval(script, keys, args);
      highest = Math.max(highest, Number(lua.store.get(keys[0]) ?? 0));
      return result;
    });

    const results = await Promise.all(
      Array.from({ length: 10 }, () => reserveDailySpend(4_000, NOW)),
    );
    const allowed = results.filter((result) => result.ok);
    assert.equal(allowed.length, 2);
    assert.equal(lua.store.get(spendKey(NOW)), '8000');
    assert.ok(highest <= cap);

    const denied = results.find((result) => !result.ok);
    assert.ok(denied);
    if (denied && !denied.ok) assert.equal(denied.reason, 'cap');
  });

  it('refunds the unused reservation and refuses a second settle', async () => {
    useRedis('1');
    const key = spendKey(NOW);
    const first = await reserveDailySpend(8_000, NOW);
    assert.equal(first.ok, true);
    if (!first.ok) return;
    await first.settle(2_000);
    await first.settle(0);
    assert.equal(redis.store.get(key), '2000');

    const second = await reserveDailySpend(8_000, NOW);
    assert.equal(second.ok, true);
    const third = await reserveDailySpend(1, NOW);
    assert.equal(third.ok, false);
    if (!third.ok) assert.equal(third.reason, 'cap');
    assert.equal(Number(redis.store.get(key)), 10_000);
  });

  it('blocks the paid call when the store is unreachable', async () => {
    useRedis('200');
    setSpendRedisForTests(async () => {
      throw new Error('ECONNRESET');
    });
    const denied = await reserveDailySpend(IMAGE_PRICE_MICRODOLLARS, NOW);
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.reason, 'unavailable');
  });

  it('settles a streamed chat to the usage chunk', async () => {
    const encoder = new TextEncoder();
    const upstream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode('data: {"choices":[{"delta":{"content":"hi"}}]}\n\n'),
        );
        controller.enqueue(
          encoder.encode(
            'data: {"usage":{"prompt_tokens":10,"completion_tokens":4,"total_tokens":14}}\n\ndata: [DONE]\n',
          ),
        );
        controller.close();
      },
    });
    let billed = -1;
    const billedStream = billTogetherStream(upstream, 5_000, async (actual) => {
      billed = actual;
    });
    const reader = billedStream.getReader();
    let text = '';
    const decoder = new TextDecoder();
    for (;;) {
      const step = await reader.read();
      if (step.done) break;
      text += decoder.decode(step.value);
    }
    assert.match(text, /hi/);
    assert.equal(billed, chatUsageMicrodollars({ prompt_tokens: 10, completion_tokens: 4 }));
    assert.deepEqual(usageFromSseBuffer('data: {"usage":{"prompt_tokens":3,"completion_tokens":1}}'), {
      prompt_tokens: 3,
      completion_tokens: 1,
    });
  });
});
