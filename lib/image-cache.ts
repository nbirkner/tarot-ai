import { Redis } from '@upstash/redis';
import { allowedTogetherImageUrl } from './proxy-image';
import { upstashConfigured } from './rate-limit-shared';

/** Long enough for a retry in the same reading and a download a few hours later. */
export const CARD_ART_TTL_SECONDS = 6 * 60 * 60;

type ImageCache = {
  get(key: string): Promise<string | null>;
  set(key: string, url: string, ttlSeconds: number): Promise<void>;
  setNx(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  del(key: string): Promise<void>;
};

let override: ImageCache | null = null;
let redis: Redis | undefined;

export function setImageCacheForTests(cache: ImageCache | null): void {
  override = cache;
  redis = undefined;
}

/** Stable id for a photo that does not store the photo itself. */
export function photoCacheTag(photo: string | undefined): string {
  if (!photo) return 'none';
  let hash = 2166136261;
  for (let i = 0; i < photo.length; i += 1) {
    hash ^= photo.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function cardArtCacheKey(input: {
  readingId: string;
  deckStyle: string;
  cardName: string;
  photo?: string;
}): string {
  const photo = photoCacheTag(input.photo);
  return [
    'tarot:card-art',
    encodeURIComponent(input.readingId),
    encodeURIComponent(input.deckStyle),
    encodeURIComponent(input.cardName),
    photo,
  ].join(':');
}

async function store(): Promise<ImageCache | null> {
  if (override) return override;
  if (!upstashConfigured()) return null;
  if (!redis) redis = Redis.fromEnv();
  const client = redis;
  return {
    async get(key) {
      const value = await client.get<string>(key);
      return typeof value === 'string' ? value : null;
    },
    async set(key, url, ttlSeconds) {
      await client.set(key, url, { ex: ttlSeconds });
    },
    async setNx(key, value, ttlSeconds) {
      const result = await client.set(key, value, { nx: true, ex: ttlSeconds });
      return result === 'OK';
    },
    async del(key) {
      await client.del(key);
    },
  };
}

/** One in-flight draw per card. A retry waits for that picture instead of paying again. */
export async function claimCardArt(lockKey: string): Promise<boolean> {
  try {
    const cache = await store();
    if (!cache) return true;
    return await cache.setNx(lockKey, '1', 90);
  } catch (err) {
    console.error(
      `card-art lock failed open (${err instanceof Error ? err.name : 'Error'})`,
    );
    return true;
  }
}

export async function releaseCardArt(lockKey: string): Promise<void> {
  try {
    const cache = await store();
    if (!cache) return;
    await cache.del(lockKey);
  } catch {
    // The lock expires on its own.
  }
}

export async function readCardArt(key: string): Promise<string | null> {
  try {
    const cache = await store();
    if (!cache) return null;
    const url = await cache.get(key);
    if (!url || !allowedTogetherImageUrl(url)) return null;
    return url;
  } catch (err) {
    console.error(
      `card-art cache read failed (${err instanceof Error ? err.name : 'Error'})`,
    );
    return null;
  }
}

export async function rememberCardArt(key: string, url: string): Promise<void> {
  if (!allowedTogetherImageUrl(url)) return;
  try {
    const cache = await store();
    if (!cache) return;
    await cache.set(key, url, CARD_ART_TTL_SECONDS);
  } catch (err) {
    console.error(
      `card-art cache write failed (${err instanceof Error ? err.name : 'Error'})`,
    );
  }
}
