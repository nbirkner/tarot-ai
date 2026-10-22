import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import type { ReadingResult } from './types.ts';
import {
  PDF_PAGE,
  createCardsPdf,
  createReadingPdf,
  paginateBlocks,
  readingSectionHeights,
} from './pdf.ts';
import type { PdfFonts } from './pdf.ts';

function font(path: string): string {
  const bytes = readFileSync(path);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return binary;
}

const fonts: PdfFonts = {
  sans: font('public/fonts/SchibstedGrotesk-Regular.ttf'),
  sansBold: font('public/fonts/SchibstedGrotesk-SemiBold.ttf'),
  mono: font('public/fonts/FragmentMono-Regular.ttf'),
};

function sentence(name: string, position: string): string {
  return `${name} in ${position} names what is already here, not what might arrive later. The figure on the card is mid-step, which matches the way this question keeps restarting. Nothing in the card asks for a performance. It asks for a clean beginning, made before the feeling of readiness shows up. Sit with the part of this that you already know and have been talking over. That is the whole instruction.`;
}

function sampleReading(): ReadingResult {
  const cards = [
    { name: 'The Fool', position: 'Past', reversed: false },
    { name: 'Three of Swords', position: 'Present', reversed: true },
    { name: 'The Star', position: 'Future', reversed: false },
  ];
  return {
    id: 'sample',
    date: '2026-10-22T16:00:00.000Z',
    question: 'What should I do with the work I keep almost starting?',
    spreadType: 'three',
    deckStyle: 'classic',
    cards: cards.map((card) => ({
      card: { name: card.name, arcana: 'major' },
      position: card.position,
      reversed: card.reversed,
    })),
    overallEnergy: 'The reading is restless in a useful way. Something unfinished is taking up the room, and the cards are more interested in the next honest step than in a verdict.',
    cardReadings: cards.map((card) => ({
      card: card.name,
      position: card.position,
      keywords: card.reversed ? ['delay', 'private hurt', 'clarity'] : ['beginning', 'attention', 'a small promise'],
      interpretation: sentence(card.name, card.position),
    })),
    synthesis: 'The Fool, the Three of Swords, and the Star are one picture: a beginning that stalled on a real disappointment, and a next step that is smaller than the story you have been telling about it. Name the work in one sentence. Do the first plain part of it this week, before you redesign the whole thing.',
    affirmation: 'You already know the first sentence of this. Write that one down.',
    notableTiming: 'Late October, under a waxing moon. A short window, not a new identity.',
  };
}

describe('pdf pagination', () => {
  it('keeps a block that does not fit on the next page instead of splitting it', () => {
    assert.deepEqual(paginateBlocks([100, 100, 80], 250), [0, 0, 1]);
    assert.deepEqual(paginateBlocks([200, 200], 250), [0, 1]);
    assert.deepEqual(paginateBlocks([300], 250), [0]);
  });

  it('fits each card and the synthesis on whole pages', () => {
    const reading = sampleReading();
    const heights = readingSectionHeights(reading, [null, null, null], fonts);
    assert.ok(heights.every((height) => height > 0 && height <= PDF_PAGE.contentHeight));
    // Intro, three whole cards, then the synthesis as one block.
    assert.equal(heights.length, 5);
    const pages = paginateBlocks(heights, PDF_PAGE.contentHeight);
    assert.deepEqual(pages, [0, 0, 0, 1, 1]);
    const used = new Map<number, number>();
    pages.forEach((page, index) => used.set(page, (used.get(page) ?? 0) + heights[index]));
    for (const total of used.values()) assert.ok(total <= PDF_PAGE.contentHeight);
  });

  it('builds a letter reading and one page per card', () => {
    const reading = sampleReading();
    const readingPdf = createReadingPdf(reading, [null, null, null], fonts);
    const cardsPdf = createCardsPdf(reading, [null], fonts);
    assert.equal(readingPdf.getNumberOfPages(), 2);
    assert.equal(cardsPdf.getNumberOfPages(), 3);
    assert.equal(readingPdf.internal.pageSize.getWidth(), PDF_PAGE.width);
    assert.equal(readingPdf.internal.pageSize.getHeight(), PDF_PAGE.height);
    const bytes = new Uint8Array(readingPdf.output('arraybuffer'));
    assert.equal(String.fromCharCode(...bytes.slice(0, 5)), '%PDF-');
  });
});
