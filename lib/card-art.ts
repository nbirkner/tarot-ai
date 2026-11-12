/**
 * One illustration prompt: the deck the reader picked, the traditional scene
 * for that card, and the Neo-Grimoire house style. The frame and the name
 * stay in the page, so the picture itself is full-bleed art with no title
 * and no border.
 */
const SAFETY =
  'Safe for work, family-friendly illustration. All figures fully clothed in robes, garments, or costumes. No exposed skin below the neck. No nudity, no bare chests, no cleavage, no suggestive poses. No children.';

const FULL_BLEED =
  'Full-bleed artwork that touches all four edges. Do not draw a card outline, rectangle, border, frame, ornament, caption band, banner, roman numeral, or any letter. Do not write a title or a name. The words in this prompt are instructions, not text to paint.';

const NEO_GRIMOIRE =
  'Neo-Grimoire illustration. Bold black line art on warm cream paper, flat ember orange and black ink, graphic print.';

/** Stricter scene used once, after Together refuses a picture as unsafe. */
const SAFE_SYMBOLIC_SCENES: Record<string, string> = {
  'The Lovers':
    'Two long robes standing under a pair of wings and a round sun. Objects and garments only. No people and no skin.',
  'The Star':
    'One large eight-pointed star, seven small stars, a pool, and two jugs pouring water. Objects only. No people and no skin.',
  'The World':
    'A circular laurel wreath, two plain wands, a lion, a bull, and an eagle. Objects and animals only. No people and no skin.',
  'The Sun':
    'A round sun, a row of sunflowers, a red banner on a pole, and a low stone wall. Objects only. No people and no animals.',
  Death:
    'A white horse, a black banner with a white rose, and a sunrise between two towers. No people and no skeleton.',
  'The Devil':
    'A stone pedestal, loose chains, and an inverted pentagram. Objects only. No people and no skin.',
  Temperance:
    'Two cups pouring water into each other, one foot of ground and one pool. Objects only. No people and no skin.',
  Judgement:
    'A trumpet above three empty coffins and a distant mountain. Objects only. No people and no skin.',
  'Six of Cups':
    'Six cups in a garden, one cup holding flowers. Objects only. No people and no skin.',
  'Ten of Cups':
    'Ten cups arranged in an arc over a cottage. Objects only. No people and no skin.',
  'Six of Swords':
    'A small boat carrying six upright swords on calm water. Objects only. No people and no skin.',
};

const GENERIC_SAFE_SCENE =
  'A simple emblem of geometric shapes and plain objects. No people, no skin, no animals.';

export function sceneWithoutTitle(symbolism: string): string {
  return symbolism.replace(/^(?:Osho Zen )?tarot card,\s*[^.]*\.\s*/i, '').trim();
}

export function safeSymbolicScene(cardName: string): string {
  return SAFE_SYMBOLIC_SCENES[cardName] ?? GENERIC_SAFE_SCENE;
}

export function buildCardImagePrompt(input: {
  symbolism: string;
  deckTheme: string;
  portrait?: string;
}): string {
  const parts = [
    SAFETY,
    FULL_BLEED,
    NEO_GRIMOIRE,
    `Deck theme: ${input.deckTheme}`,
    `Scene to illustrate, not to letter: ${sceneWithoutTitle(input.symbolism)}`,
  ];
  if (input.portrait) {
    parts.push(
      `The human figures are adults who resemble this person and stay fully clothed: ${input.portrait}`,
    );
  }
  parts.push(FULL_BLEED);
  return parts.join(' ');
}
