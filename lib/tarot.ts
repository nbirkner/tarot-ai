import { TarotCard, SpreadDefinition, SpreadType } from './types';

export const MAJOR_ARCANA: TarotCard[] = [
  { name: 'The Fool', arcana: 'major', number: 0 },
  { name: 'The Magician', arcana: 'major', number: 1 },
  { name: 'The High Priestess', arcana: 'major', number: 2 },
  { name: 'The Empress', arcana: 'major', number: 3 },
  { name: 'The Emperor', arcana: 'major', number: 4 },
  { name: 'The Hierophant', arcana: 'major', number: 5 },
  { name: 'The Lovers', arcana: 'major', number: 6 },
  { name: 'The Chariot', arcana: 'major', number: 7 },
  { name: 'Strength', arcana: 'major', number: 8 },
  { name: 'The Hermit', arcana: 'major', number: 9 },
  { name: 'Wheel of Fortune', arcana: 'major', number: 10 },
  { name: 'Justice', arcana: 'major', number: 11 },
  { name: 'The Hanged Man', arcana: 'major', number: 12 },
  { name: 'Death', arcana: 'major', number: 13 },
  { name: 'Temperance', arcana: 'major', number: 14 },
  { name: 'The Devil', arcana: 'major', number: 15 },
  { name: 'The Tower', arcana: 'major', number: 16 },
  { name: 'The Star', arcana: 'major', number: 17 },
  { name: 'The Moon', arcana: 'major', number: 18 },
  { name: 'The Sun', arcana: 'major', number: 19 },
  { name: 'Judgement', arcana: 'major', number: 20 },
  { name: 'The World', arcana: 'major', number: 21 },
];

const SUITS = ['wands', 'cups', 'swords', 'pentacles'] as const;
const COURT = ['Page', 'Knight', 'Queen', 'King'];
const PIPS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export const MINOR_ARCANA: TarotCard[] = SUITS.flatMap((suit) => [
  ...PIPS.map((pip, i) => ({ name: `${pip} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`, arcana: 'minor' as const, suit, number: i + 1 })),
  ...COURT.map((court, i) => ({ name: `${court} of ${suit.charAt(0).toUpperCase() + suit.slice(1)}`, arcana: 'minor' as const, suit, number: i + 11 })),
]);

export const FULL_DECK: TarotCard[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];

export const SPREADS: SpreadDefinition[] = [
  {
    type: 'single',
    label: 'Single Card',
    cardCount: 1,
    positions: ['Your Card'],
    description: 'One card. One truth. No excuses.',
  },
  {
    type: 'three',
    label: 'Three Card',
    cardCount: 3,
    positions: ['Past', 'Present', 'Future'],
    description: 'Past, Present, Future (allegedly)',
  },
  {
    type: 'five',
    label: 'Five Card',
    cardCount: 5,
    positions: ['Situation', 'Challenge', 'Advice', 'Hidden Influences', 'Outcome'],
    description: 'A path through a decision (no refunds)',
  },
  {
    type: 'celtic',
    label: 'Celtic Cross',
    cardCount: 10,
    positions: [
      'Present',
      'Challenge',
      'Distant Past',
      'Recent Past',
      'Best Outcome',
      'Near Future',
      'Your Attitude',
      'External Influences',
      'Hopes and Fears',
      'Final Outcome',
    ],
    description: 'Ten cards. Zero chill. Maximum unsolicited advice.',
  },
];

/** Draw n unique cards from the deck, no duplicates. Each card has a 1-in-5 chance of being reversed. */
export function drawCards(count: number): TarotCard[] {
  const deck = [...FULL_DECK];
  const drawn: TarotCard[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * deck.length);
    drawn.push(deck.splice(idx, 1)[0]);
  }
  return drawn;
}

export function isReversed(): boolean {
  return Math.random() < 0.2; // 20% chance reversed
}

export function getSpread(type: SpreadType): SpreadDefinition {
  return SPREADS.find((s) => s.type === type)!;
}
