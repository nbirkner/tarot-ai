/**
 * One illustration prompt: the deck the reader picked, the traditional scene
 * for that card, and the Neo-Grimoire house style. The frame and the name
 * stay in the page, so the picture is full-bleed art.
 * Every sentence is positive. The safety checker treats words for what to
 * leave out as a request for those things.
 */
const SAFETY =
  'A printed storybook illustration. Every person wears a long robe, cloak, or costume from neck to ankle.';

const FULL_BLEED =
  'Full-bleed illustration. The scene runs to every edge. Robed figures, objects, landscapes, and symbols fill the picture.';

const NEO_GRIMOIRE =
  'Neo-Grimoire illustration. Bold black line art on warm cream paper, flat ember orange and black ink, graphic print.';

/** Positive scenes kept for a stricter second description. */
const SAFE_SYMBOLIC_SCENES: Record<string, string> = {
  'The Lovers':
    'Two long robes stand under a pair of wings and a round sun.',
  'The Star':
    'One large eight-pointed star, seven small stars, a pool, and two jugs pouring water.',
  'The World':
    'A circular laurel wreath, two plain wands, a lion, a bull, and an eagle.',
  'The Sun':
    'A round sun, a row of sunflowers, a red banner on a pole, and a low stone wall.',
  Death:
    'A white horse, a black banner with a white rose, and a sunrise between two towers.',
  'The Devil':
    'A stone pedestal, loose chains, and an inverted pentagram.',
  Temperance:
    'Two cups pour water into each other between a stretch of ground and a pool.',
  Judgement:
    'A trumpet above three coffins and a distant mountain.',
  'Six of Cups':
    'Six cups in a garden, one cup holding flowers.',
  'Ten of Cups':
    'Ten cups arranged in an arc over a cottage.',
  'Six of Swords':
    'A small boat carrying six upright swords on calm water.',
};

const GENERIC_SAFE_SCENE =
  'A simple emblem of geometric shapes, cups, wands, and plain objects.';

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
    `Scene: ${sceneWithoutTitle(input.symbolism)}`,
  ];
  if (input.portrait) {
    parts.push(
      `The robed figures share the face and coloring of this person: ${input.portrait}`,
    );
  }
  parts.push(FULL_BLEED);
  return parts.join(' ');
}
