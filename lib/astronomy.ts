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

function getPlanetSign(body: Astronomy.Body, time: ReturnType<typeof Astronomy.MakeTime>): string {
  const lon = Astronomy.EclipticLongitude(body, time);
  return ZODIAC_SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

function getAscendant(birthTime: ReturnType<typeof Astronomy.MakeTime>, lat: number, lon: number): string {
  // Greenwich Apparent Sidereal Time in hours
  const gast = Astronomy.SiderealTime(birthTime);
  // Local Sidereal Time (hours)
  const lst = ((gast + lon / 15) % 24 + 24) % 24;
  // Right Ascension of Midheaven in radians
  const ramc = (lst * 15 * Math.PI) / 180;
  // Obliquity of ecliptic in radians (~23.44 degrees)
  const eps = (23.4397 * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  // Ascendant formula
  let ascLon = Math.atan2(
    -Math.cos(ramc),
    Math.sin(eps) * Math.tan(latRad) + Math.cos(eps) * Math.sin(ramc)
  ) * (180 / Math.PI);
  ascLon = ((ascLon % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(ascLon / 30)];
}

export function formatAstrologyContext(input: AstrologyInput, date: Date): string {
  if (input.type === 'none') return '';

  if (input.type === 'sun-sign') {
    const nowTime = Astronomy.MakeTime(date);
    const currentSun = getPlanetSign(Astronomy.Body.Sun, nowTime);
    const currentMoon = getPlanetSign(Astronomy.Body.Moon, nowTime);
    const currentVenus = getPlanetSign(Astronomy.Body.Venus, nowTime);
    return `Sun sign: ${input.sign}.\nCurrent transits: Sun in ${currentSun}, Moon in ${currentMoon}, Venus in ${currentVenus}.`;
  }

  // birth-data: full natal chart
  try {
    const birthDate = new Date(input.date + 'T' + (input.time || '12:00') + ':00');
    const birthTime = Astronomy.MakeTime(birthDate);
    const nowTime = Astronomy.MakeTime(date);

    const planets = [
      { name: 'Sun', body: Astronomy.Body.Sun },
      { name: 'Moon', body: Astronomy.Body.Moon },
      { name: 'Mercury', body: Astronomy.Body.Mercury },
      { name: 'Venus', body: Astronomy.Body.Venus },
      { name: 'Mars', body: Astronomy.Body.Mars },
      { name: 'Jupiter', body: Astronomy.Body.Jupiter },
      { name: 'Saturn', body: Astronomy.Body.Saturn },
    ];

    const natalPositions = planets.map(p => `${p.name} in ${getPlanetSign(p.body, birthTime)}`);

    // Rising sign if lat/lon available
    const rising =
      input.lat != null && input.lon != null
        ? getAscendant(birthTime, input.lat, input.lon)
        : null;

    // Current transits (today)
    const currentTransits = planets.map(p => `${p.name} in ${getPlanetSign(p.body, nowTime)}`);

    // Build the formatted string
    let result = `NATAL CHART:\n`;
    result += natalPositions.join(', ');
    if (rising) result += `, Rising in ${rising}`;
    result += `\n\nCURRENT TRANSITS (today):\n`;
    result += currentTransits.join(', ');
    result += `\n\nKEY NATAL INFLUENCES:\n`;

    // Interpretive layer for Sun/Moon/Rising
    const sunSign = getPlanetSign(Astronomy.Body.Sun, birthTime);
    const moonSign = getPlanetSign(Astronomy.Body.Moon, birthTime);
    result += `Sun in ${sunSign} (core identity, ego, life force). `;
    result += `Moon in ${moonSign} (emotional nature, instincts, subconscious). `;
    if (rising) result += `Rising in ${rising} (outward persona, first impressions, how the world sees you). `;

    // Venus and Mars
    const venusSign = getPlanetSign(Astronomy.Body.Venus, birthTime);
    const marsSign = getPlanetSign(Astronomy.Body.Mars, birthTime);
    result += `Venus in ${venusSign} (love language, values, attraction). `;
    result += `Mars in ${marsSign} (drive, passion, how you take action).`;

    return result;
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
