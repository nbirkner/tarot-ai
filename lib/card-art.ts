/**
 * One illustration prompt: the deck the reader picked, the traditional scene
 * for that card, and the Neo-Grimoire house style. The frame and the name
 * stay in the page, so the picture is full-bleed art.
 * Every sentence is positive. The safety checker treats words for what to
 * leave out as a request for those things.
 */
const SAFETY =
  'Every person wears a long robe, cloak, or costume from neck to ankle.';

const NEO_GRIMOIRE =
  'Neo-Grimoire palette. Bold black line art on warm cream paper, flat ember orange and black ink, graphic print.';

/** Words that make the model paint a printed card template. */
const TEMPLATE_WORDS = /\b(?:tarot|cards|card|titles|title|labels|label)\b/gi;

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

const CONCRETE =
  /\b(?:suns?|sunrise|horses?|walls?|cups?|swords?|wands?|towers?|robes?|figures?|stars?|moon|water|trees?|flowers?|fields?|flags?|banners?|stones?|wings?|lions?|bulls?|eagles?|pools?|jugs?|chains?|pedestals?|trumpets?|coffins?|boats?|gardens?|cottages?|hands?|clouds?|mountains?|thrones?|pillars?|dogs?|roses?|lanterns?|wheels?|scales?|chariots?|sphinxes?|keys?|scrolls?|wheat|forests?|seas?|ships?|castles?|rainbows?|fish|birds?|cats?|lizards?|coins?|pentacles?|vines?|rabbits?|grapes?|arches?|windows?|tombs?|hearts?|rain|beds?|bridges?|paths?|gates?|cloaks?|angels?|wreaths?|dancers?|pentagrams?|people|persons?|adults?)\b/i;

export function sceneWithoutTitle(symbolism: string): string {
  const stripped = symbolism
    .replace(/^(?:Osho Zen )?tarot card,\s*[^.]*\.\s*/i, '')
    .replace(/\brider[-\s]?waite\b/gi, '')
    .replace(/\btraditional symbolism,?\s*/gi, '')
    .replace(/\breminiscent of\s*(?:rider[-\s]?waite\s*)?(?:but\s*)?/gi, '')
    .replace(TEMPLATE_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
  const sentences = stripped.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const visual = sentences.filter((sentence) => CONCRETE.test(sentence));
  return (visual.length > 0 ? visual : sentences.slice(0, 1)).join(' ');
}

export function safeSymbolicScene(cardName: string): string {
  return SAFE_SYMBOLIC_SCENES[cardName] ?? GENERIC_SAFE_SCENE;
}

export function buildCardImagePrompt(input: {
  symbolism: string;
  deckTheme: string;
  portrait?: string;
}): string {
  const scene = sceneWithoutTitle(input.symbolism);
  const theme = sceneWithoutTitle(input.deckTheme);
  const parts = [
    `A full-bleed illustration of ${scene}, edge to edge, with no frame and no lettering.`,
    'Open sky fills the top edge. Ground fills the bottom edge. The corners are sky, ground, or the figures themselves.',
    SAFETY,
    NEO_GRIMOIRE,
    `Style: ${theme}.`,
    'A full-bleed illustration, edge to edge, with no frame and no lettering.',
  ];
  if (input.portrait) {
    parts.push(
      `The robed figures share the face and coloring of this person: ${sceneWithoutTitle(input.portrait)}.`,
    );
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
