import { ReadingResult } from './types';

const KEYS = {
  userId: 'tarot-ai:user-id',
  readings: 'tarot-ai:readings',
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
  readings.unshift(reading);
  localStorage.setItem(KEYS.readings, JSON.stringify(readings.slice(0, 200)));
}

export function getReadings(): ReadingResult[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEYS.readings) || '[]');
  } catch {
    return [];
  }
}
