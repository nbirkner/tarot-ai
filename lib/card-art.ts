/**
 * One illustration prompt: the deck the reader picked, the traditional scene
 * for that card, and the Neo-Grimoire house style. The frame and the name
 * stay in the page, so the picture itself has no title and no border.
 */
const SAFETY =
  'Safe for work, family-friendly illustration. All figures fully clothed in robes, garments, or costumes. No exposed skin below the neck. No nudity, no bare chests, no cleavage, no suggestive poses.';

const NEO_GRIMOIRE =
  'Neo-Grimoire illustration. Bold black line art on warm cream paper, flat ember orange and black ink, graphic print. The scene fills the image edge to edge. No letters, no numbers, no words, no title, no caption, no border, no card frame, no margin.';

export function buildCardImagePrompt(input: {
  symbolism: string;
  deckTheme: string;
  portrait?: string;
}): string {
  const parts = [
    SAFETY,
    NEO_GRIMOIRE,
    `Deck theme: ${input.deckTheme}`,
    `Traditional scene: ${input.symbolism}`,
  ];
  if (input.portrait) {
    parts.push(
      `The human figures resemble this person and stay fully clothed: ${input.portrait}`,
    );
  }
  return parts.join(' ');
}
