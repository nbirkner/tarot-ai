import { ReadingResult, DrawnCard } from './types';

const KEYS = {
  userId: 'tarot-ai:user-id',
  readings: 'tarot-ai:readings',
  collection: 'tarot-ai:collection',
} as const;

export function getUserId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(KEYS.userId);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEYS.userId, id);
  }
  return id;
}

export function saveReading(reading: ReadingResult): void {
  if (typeof window === 'undefined') return;
  const readings = getReadings();
  readings.unshift(reading); // newest first
  localStorage.setItem(KEYS.readings, JSON.stringify(readings.slice(0, 200))); // cap at 200

  // Add cards to collection
  const collection = getCollection();
  for (const drawn of reading.cards) {
    collection.unshift({ ...drawn, readingId: reading.id, readingDate: reading.date });
  }
  localStorage.setItem(KEYS.collection, JSON.stringify(collection.slice(0, 2000)));
}

export function getReadings(): ReadingResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.readings) || '[]');
  } catch {
    return [];
  }
}

export interface CollectionEntry extends DrawnCard {
  readingId: string;
  readingDate: string;
}

export function getCollection(): CollectionEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.collection) || '[]');
  } catch {
    return [];
  }
}
