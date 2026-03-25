export type SpreadType = 'single' | 'three' | 'five' | 'celtic';

export type DeckStyle = 'dark-gothic' | 'ethereal' | 'classic';

export type AstrologyInput =
  | { type: 'sun-sign'; sign: string }
  | { type: 'birth-data'; date: string; time: string; location: string }
  | { type: 'none' };

export interface TarotCard {
  name: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number?: number; // 1-14 for minor, 0-21 for major
}

export interface DrawnCard {
  card: TarotCard;
  position: string; // e.g. "Past", "Card 1", "The Significator"
  reversed: boolean;
  imageUrl?: string;
}

export interface CardReading {
  card: string;
  position: string;
  keywords: string[];
  interpretation: string;
}

export interface ReadingResult {
  id: string;
  date: string; // ISO string
  question: string;
  spreadType: SpreadType;
  deckStyle: DeckStyle;
  cards: DrawnCard[];
  overallEnergy: string;
  cardReadings: CardReading[];
  synthesis: string;
  affirmation: string;
  notableTiming: string;
}

export interface GenerateCardRequest {
  cardName: string;
  deckStyle: DeckStyle;
  userId: string;
  date: string; // YYYY-MM-DD for seed
  userPhotoBase64?: string; // optional base64 data URI for personalized card faces
}

export interface GenerateCardResponse {
  imageUrl: string;
  estimatedCost: number;
}

export interface GenerateReadingRequest {
  question: string;
  spreadType: SpreadType;
  cards: Array<{ name: string; position: string; reversed: boolean }>;
  astrology: AstrologyInput;
  formattedAstrology: string;
  moonPhase: string;
  dayOfWeek: string;
  season: string;
  timeOfDay: string;
}

export interface SpreadDefinition {
  type: SpreadType;
  label: string;
  cardCount: number;
  positions: string[];
  description: string;
}

export interface DeckDefinition {
  style: DeckStyle;
  label: string;
  description: string;
  promptModifier: string;
}
