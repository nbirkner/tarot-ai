import * as Astronomy from 'astronomy-engine';
import { AstrologyInput } from './types';

export const MOON_PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
] as const;

export const DAY_CORRESPONDENCES: Record<number, { name: string; planet: string; themes: string }> = {
  0: { name: 'Sunday', planet: 'The Sun', themes: 'vitality, success, clarity, and light' },
  1: { name: 'Monday', planet: 'The Moon', themes: 'intuition, emotion, reflection, and cycles' },
  2: { name: 'Tuesday', planet: 'Mars', themes: 'action, courage, willpower, and forward motion' },
  3: { name: 'Wednesday', planet: 'Mercury', themes: 'communication, thought, quick shifts, and messages' },
  4: { name: 'Thursday', planet: 'Jupiter', themes: 'expansion, abundance, luck, and wisdom' },
  5: { name: 'Friday', planet: 'Venus', themes: 'love, beauty, pleasure, and connection' },
  6: { name: 'Saturday', planet: 'Saturn', themes: 'discipline, karma, lessons, and boundaries' },
};

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const SUN_SIGN_LIST = ZODIAC_SIGNS;

export function getMoonPhase(date: Date): { phase: string; illumination: number; daysToFull: number } {
  const observer = new Astronomy.Observer(40.7128, -74.006, 0); // NYC default, close enough for phase
  void observer;
  const jd = Astronomy.MakeTime(date);
  const moonPhaseAngle = Astronomy.MoonPhase(jd);
  // 0=new, 90=first quarter, 180=full, 270=last quarter
  const phaseIndex = Math.round((moonPhaseAngle / 360) * 8) % 8;
  const phase = MOON_PHASES[phaseIndex];
  const illumination = Math.abs(Math.cos((moonPhaseAngle * Math.PI) / 180));

  // Days to next full moon
  const nextFull = Astronomy.SearchMoonPhase(180, jd, 30);
  const daysToFull = nextFull ? Math.round((nextFull.tt - jd.tt) * 10) / 10 : 0;

  return { phase, illumination: Math.round(illumination * 100), daysToFull };
}

export function getDayContext(date: Date): string {
  const day = DAY_CORRESPONDENCES[date.getDay()];
  return `${day.name} (${day.planet} — ${day.themes})`;
}

export function getTimeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Late Night';
}

export function getSeason(date: Date): string {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return 'Spring (renewal, new beginnings, Ostara energy)';
  if (month >= 5 && month <= 7) return 'Summer (abundance, full power, Litha energy)';
  if (month >= 8 && month <= 10) return 'Autumn (harvest, release, Mabon energy)';
  return 'Winter (stillness, introspection, Yule energy)';
}

export function formatAstrologyContext(input: AstrologyInput, date: Date): string {
  if (input.type === 'none') return '';

  if (input.type === 'sun-sign') {
    return `Sun sign: ${input.sign}. Current solar transit influences ${input.sign} themes.`;
  }

  // birth-data: calculate sun/moon/rising from astronomy-engine
  try {
    const birthDate = new Date(input.date + 'T' + (input.time || '12:00') + ':00');
    const birthTime = Astronomy.MakeTime(birthDate);
    const sunLon = Astronomy.EclipticLongitude(Astronomy.Body.Sun, birthTime);
    const sunSignIndex = Math.floor(sunLon / 30) % 12;
    const sunSign = ZODIAC_SIGNS[sunSignIndex];

    // Moon position
    const moonLon = Astronomy.EclipticLongitude(Astronomy.Body.Moon, birthTime);
    const moonSignIndex = Math.floor(moonLon / 30) % 12;
    const moonSign = ZODIAC_SIGNS[moonSignIndex];

    // Today's transits
    const now = Astronomy.MakeTime(date);
    const currentSunLon = Astronomy.EclipticLongitude(Astronomy.Body.Sun, now);
    const currentSunSign = ZODIAC_SIGNS[Math.floor(currentSunLon / 30) % 12];

    return `Natal: Sun in ${sunSign}, Moon in ${moonSign}. Current transit: Sun in ${currentSunSign}.`;
  } catch {
    return input.type === 'birth-data' ? `Birth date: ${input.date}` : '';
  }
}

export function buildReadingContext(date: Date) {
  const moonInfo = getMoonPhase(date);
  return {
    moonPhase: `${moonInfo.phase} (${moonInfo.illumination}% illuminated, ${moonInfo.daysToFull} days to full moon)`,
    dayOfWeek: getDayContext(date),
    season: getSeason(date),
    timeOfDay: getTimeOfDay(date),
  };
}
