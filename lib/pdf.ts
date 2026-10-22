import { jsPDF } from 'jspdf';
import { apiUrl, basePathFromPathname, withBasePath } from './base-path';
import type { ReadingResult } from './types';

// US Letter. Side margins are 1in. Header and footer sit inside the vertical margin.
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 72;
const CONTENT_TOP = 76;
const CONTENT_BOTTOM = 716;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const CONTENT_H = CONTENT_BOTTOM - CONTENT_TOP;

const FG: [number, number, number] = [17, 17, 17];
const MUTED: [number, number, number] = [107, 107, 107];
const ACCENT: [number, number, number] = [194, 65, 12];
const HAIRLINE: [number, number, number] = [234, 234, 232];
const PLACEHOLDER: [number, number, number] = [241, 241, 239];

const SANS = 'Schibsted';
const MONO = 'Fragment';

const READING_IMG_W = 132;
const READING_IMG_H = 224;
const CARD_IMG_W = 270;
const CARD_IMG_H = 459;

export type PdfFonts = {
  sans: string;
  sansBold: string;
  mono: string;
};

type PdfImage = string | null;

type Block = {
  height: number;
  draw: (y: number) => void;
};

type CardSource = {
  name: string;
  position: string;
  reversed: boolean;
  keywords: string[];
  interpretation: string;
  image: PdfImage;
};

export const PDF_PAGE = {
  width: PAGE_W,
  height: PAGE_H,
  contentTop: CONTENT_TOP,
  contentBottom: CONTENT_BOTTOM,
  contentWidth: CONTENT_W,
  contentHeight: CONTENT_H,
  readingImage: { width: READING_IMG_W, height: READING_IMG_H },
  cardImage: { width: CARD_IMG_W, height: CARD_IMG_H },
};

function bytesToBinary(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return binary;
}

export async function loadPdfFonts(): Promise<PdfFonts> {
  const base = typeof window === 'undefined' ? '' : basePathFromPathname(window.location.pathname);
  async function load(path: string): Promise<string> {
    const res = await fetch(withBasePath(path, base));
    if (!res.ok) throw new Error(`Could not load ${path}`);
    return bytesToBinary(new Uint8Array(await res.arrayBuffer()));
  }
  const [sans, sansBold, mono] = await Promise.all([
    load('/fonts/SchibstedGrotesk-Regular.ttf'),
    load('/fonts/SchibstedGrotesk-SemiBold.ttf'),
    load('/fonts/FragmentMono-Regular.ttf'),
  ]);
  return { sans, sansBold, mono };
}

export function registerPdfFonts(doc: jsPDF, fonts: PdfFonts): void {
  doc.addFileToVFS('SchibstedGrotesk-Regular.ttf', fonts.sans);
  doc.addFont('SchibstedGrotesk-Regular.ttf', SANS, 'normal');
  doc.addFileToVFS('SchibstedGrotesk-SemiBold.ttf', fonts.sansBold);
  doc.addFont('SchibstedGrotesk-SemiBold.ttf', SANS, 'bold');
  doc.addFileToVFS('FragmentMono-Regular.ttf', fonts.mono);
  doc.addFont('FragmentMono-Regular.ttf', MONO, 'normal');
}

function clean(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[^\u0000-\u00FF\u2010-\u2027\n]/g, '')
    .trim();
}

function wrap(doc: jsPDF, text: string, width: number, font: string, style: string, size: number): string[] {
  const value = clean(text).replace(/\n+/g, ' ');
  if (!value) return [];
  doc.setFont(font, style);
  doc.setFontSize(size);
  return (doc.splitTextToSize(value, width) as string[]).filter((line) => line.length > 0);
}

function roman(n: number): string {
  const vals = [10, 9, 5, 4, 1];
  const syms = ['X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  let left = n;
  vals.forEach((value, index) => {
    while (left >= value) {
      result += syms[index];
      left -= value;
    }
  });
  return result || String(n);
}

/** Each block stays on one page. A block taller than the page still gets its own page. */
export function paginateBlocks(heights: number[], contentHeight: number): number[] {
  const pages: number[] = [];
  let used = 0;
  let page = 0;
  for (const height of heights) {
    if (used > 0 && used + height > contentHeight) {
      page += 1;
      used = 0;
    }
    pages.push(page);
    used += height;
  }
  return pages;
}

function paintChrome(doc: jsPDF): void {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setFont(MONO, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('Niki Birkner / tarot-ai', MARGIN_X, 42);

    doc.setDrawColor(...HAIRLINE);
    doc.setLineWidth(0.75);
    doc.line(MARGIN_X, 54, PAGE_W - MARGIN_X, 54);
    doc.line(MARGIN_X, 732, PAGE_W - MARGIN_X, 732);

    doc.setFont(MONO, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text('nikibirkner.com/tarot-ai', MARGIN_X, 754);
    doc.text(String(page), PAGE_W - MARGIN_X, 754, { align: 'right' });
  }
}

function drawFrame(doc: jsPDF, x: number, y: number, w: number, h: number): void {
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.75);
  doc.rect(x, y, w, h, 'S');
}

function fittedImageRect(
  doc: jsPDF,
  image: string,
  x: number,
  y: number,
  w: number,
  h: number,
): { x: number; y: number; w: number; h: number } {
  try {
    const props = doc.getImageProperties(image);
    const ratio = props.width / props.height;
    if (!Number.isFinite(ratio) || ratio <= 0) return { x, y, w, h };
    const box = w / h;
    if (Math.abs(ratio - box) < 0.02) return { x, y, w, h };
    if (ratio > box) {
      const dh = w / ratio;
      return { x, y: y + (h - dh) / 2, w, h: dh };
    }
    const dw = h * ratio;
    return { x: x + (w - dw) / 2, y, w: dw, h };
  } catch {
    return { x, y, w, h };
  }
}

function drawImageOrPlaceholder(
  doc: jsPDF,
  image: PdfImage,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
): void {
  let drew = false;
  if (image) {
    try {
      const format = image.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      const fitted = fittedImageRect(doc, image, x, y, w, h);
      if (fitted.w < w - 0.5 || fitted.h < h - 0.5) {
        doc.setFillColor(...PLACEHOLDER);
        doc.rect(x, y, w, h, 'F');
      }
      doc.addImage(image, format, fitted.x, fitted.y, fitted.w, fitted.h);
      drew = true;
    } catch (error) {
      console.warn('Could not embed card image:', error);
    }
  }
  if (!drew) {
    doc.setFillColor(...PLACEHOLDER);
    doc.rect(x, y, w, h, 'F');
    const lines = wrap(doc, label, w - 36, MONO, 'normal', 9);
    const lineH = 13;
    const blockH = Math.max(lines.length, 1) * lineH;
    let baseline = y + (h - blockH) / 2 + 9;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(1.5);
    doc.line(x + w / 2 - 9, baseline - 18, x + w / 2 + 9, baseline - 18);
    doc.setFont(MONO, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    for (const line of lines.length ? lines : ['Card']) {
      doc.text(line, x + w / 2, baseline, { align: 'center' });
      baseline += lineH;
    }
  }
  drawFrame(doc, x, y, w, h);
}

function cardsOf(reading: ReadingResult, images: PdfImage[]): CardSource[] {
  const count = Math.max(reading.cards.length, reading.cardReadings.length);
  const cards: CardSource[] = [];
  for (let i = 0; i < count; i += 1) {
    const drawn = reading.cards[i];
    const read = reading.cardReadings[i];
    cards.push({
      name: clean(read?.card || drawn?.card.name || 'Card'),
      position: clean(read?.position || drawn?.position || ''),
      reversed: Boolean(drawn?.reversed),
      keywords: (read?.keywords ?? []).map((keyword) => clean(keyword)).filter(Boolean),
      interpretation: clean(read?.interpretation || ''),
      image: images[i] ?? null,
    });
  }
  return cards;
}

function drawWrapped(
  doc: jsPDF,
  lines: string[],
  x: number,
  baseline: number,
  leading: number,
  font: string,
  style: string,
  size: number,
  color: [number, number, number],
): number {
  doc.setFont(font, style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  for (const line of lines) {
    doc.text(line, x, baseline);
    baseline += leading;
  }
  return baseline;
}

function layoutReadingCard(doc: jsPDF, card: CardSource, index: number): Block[] {
  const sideW = CONTENT_W - READING_IMG_W - 20;
  const position = [roman(index + 1), card.position].filter(Boolean).join('  ·  ');
  const nameLines = wrap(doc, card.name, sideW, SANS, 'bold', 16);
  const keywordLines = card.keywords.length
    ? wrap(doc, card.keywords.join('   ·   '), sideW, MONO, 'normal', 9)
    : [];
  const meaningSide = wrap(doc, card.interpretation, sideW, SANS, 'normal', 11);
  const meaningFull = wrap(doc, card.interpretation, CONTENT_W, SANS, 'normal', 11);
  const shownName = nameLines.length ? nameLines : [card.name || 'Card'];

  // Offsets match the baselines in drawCard, measured from the top of the card.
  let cursor = 14;
  cursor += 22;
  cursor += shownName.length * 20;
  if (keywordLines.length) cursor += 6 + keywordLines.length * 13;
  const metaBottom = cursor;
  const sideMeaningEnd = meaningSide.length ? metaBottom + 12 + (meaningSide.length - 1) * 16 + 6 : metaBottom;
  const beside = sideMeaningEnd <= READING_IMG_H;
  const meaningTop = Math.max(READING_IMG_H, metaBottom) + 22;
  const naturalHeight = beside
    ? READING_IMG_H + 28
    : (meaningFull.length ? meaningTop + meaningFull.length * 16 : Math.max(READING_IMG_H, metaBottom)) + 28;

  const drawCard = (y: number, lines: string[], continued: boolean, inColumn: boolean) => {
    const textX = MARGIN_X + READING_IMG_W + 20;
    if (!continued) {
      drawImageOrPlaceholder(doc, card.image, MARGIN_X, y, READING_IMG_W, READING_IMG_H, card.name);
      let baseline = y + 14;
      doc.setFont(MONO, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      doc.text(position, textX, baseline);
      if (card.reversed) {
        doc.setTextColor(...ACCENT);
        doc.text(position ? '  ·  Reversed' : 'Reversed', textX + doc.getTextWidth(position), baseline);
      }
      baseline += 22;
      baseline = drawWrapped(doc, shownName, textX, baseline, 20, SANS, 'bold', 16, FG);
      if (keywordLines.length) {
        baseline += 6;
        baseline = drawWrapped(doc, keywordLines, textX, baseline, 13, MONO, 'normal', 9, MUTED);
      }
      if (inColumn && lines.length) {
        drawWrapped(doc, lines, textX, baseline + 12, 16, SANS, 'normal', 11, FG);
      }
      if (inColumn) return;
    } else {
      doc.setFont(MONO, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      doc.text(`${card.name}  ·  continued`, MARGIN_X, y + 12);
    }

    if (!lines.length) return;
    const firstLine = continued ? y + 32 : y + meaningTop;
    drawWrapped(doc, lines, MARGIN_X, firstLine, 16, SANS, 'normal', 11, FG);
  };

  if (naturalHeight <= CONTENT_H) {
    return [{
      height: naturalHeight,
      draw(y) {
        drawCard(y, beside ? meaningSide : meaningFull, false, beside);
      },
    }];
  }

  // Only a meaning far longer than a reading uses a second page, and the figure stays whole.
  const firstRoom = CONTENT_H - meaningTop - 28;
  const firstCount = Math.max(0, Math.floor(firstRoom / 16));
  const nextRoom = CONTENT_H - 48;
  const nextCount = Math.max(1, Math.floor(nextRoom / 16));
  const chunks: string[][] = [meaningFull.slice(0, firstCount)];
  for (let i = firstCount; i < meaningFull.length; i += nextCount) {
    chunks.push(meaningFull.slice(i, i + nextCount));
  }

  return chunks.map((lines, chunkIndex) => {
    const continued = chunkIndex > 0;
    const height = continued
      ? 48 + lines.length * 16
      : meaningTop + lines.length * 16 + 28;
    return {
      height: Math.min(height, CONTENT_H),
      draw(y: number) {
        drawCard(y, lines, continued, false);
      },
    };
  });
}

function layoutIntro(doc: jsPDF, reading: ReadingResult): Block {
  const date = new Date(reading.date);
  const dateLabel = Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const questionLines = wrap(doc, reading.question, CONTENT_W, SANS, 'normal', 13);
  let height = 22 + 32 + 8;
  if (questionLines.length) height += 26 + 18 + questionLines.length * 18;
  height += 12;

  return {
    height,
    draw(y) {
      let baseline = y + 22;
      doc.setFont(SANS, 'bold');
      doc.setFontSize(22);
      doc.setTextColor(...FG);
      doc.text('Reading', MARGIN_X, baseline);
      doc.setDrawColor(...ACCENT);
      doc.setLineWidth(2);
      doc.line(MARGIN_X, baseline + 10, MARGIN_X + 28, baseline + 10);

      baseline += 32;
      if (dateLabel) {
        doc.setFont(MONO, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...MUTED);
        doc.text(dateLabel, MARGIN_X, baseline);
      }

      if (questionLines.length) {
        baseline += 26;
        doc.setFont(MONO, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...MUTED);
        doc.text('Question', MARGIN_X, baseline);
        baseline += 18;
        drawWrapped(doc, questionLines, MARGIN_X, baseline, 18, SANS, 'normal', 13, FG);
      }
    },
  };
}

function layoutSynthesis(doc: jsPDF, reading: ReadingResult): Block[] {
  const energy = wrap(doc, reading.overallEnergy, CONTENT_W, SANS, 'normal', 13);
  const body = wrap(doc, reading.synthesis, CONTENT_W, SANS, 'normal', 11);
  const affirmation = clean(reading.affirmation);
  const affirmationLines = affirmation
    ? wrap(doc, `\u201C${affirmation}\u201D`, CONTENT_W - 16, SANS, 'normal', 13)
    : [];
  const timing = wrap(doc, reading.notableTiming, CONTENT_W, MONO, 'normal', 10);
  if (!energy.length && !body.length && !affirmationLines.length && !timing.length) return [];

  const blocks: Block[] = [];

  const headingAndEnergy = 14 + 22 + energy.length * 18 + (energy.length ? 8 : 0);
  blocks.push({
    height: headingAndEnergy,
    draw(y) {
      let baseline = y + 12;
      doc.setFont(MONO, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      doc.text('Synthesis', MARGIN_X, baseline);
      baseline += 22;
      drawWrapped(doc, energy, MARGIN_X, baseline, 18, SANS, 'normal', 13, FG);
    },
  });

  if (body.length) {
    blocks.push({
      height: body.length * 16 + 12,
      draw(y) {
        drawWrapped(doc, body, MARGIN_X, y + 12, 16, SANS, 'normal', 11, FG);
      },
    });
  }

  if (affirmationLines.length) {
    const textH = affirmationLines.length * 18;
    blocks.push({
      height: textH + 16,
      draw(y) {
        doc.setDrawColor(...ACCENT);
        doc.setLineWidth(2);
        doc.line(MARGIN_X, y + 2, MARGIN_X, y + 2 + textH);
        drawWrapped(doc, affirmationLines, MARGIN_X + 14, y + 14, 18, SANS, 'normal', 13, FG);
      },
    });
  }

  if (timing.length) {
    blocks.push({
      height: timing.length * 14 + 10,
      draw(y) {
        drawWrapped(doc, timing, MARGIN_X, y + 12, 14, MONO, 'normal', 10, MUTED);
      },
    });
  }

  const total = blocks.reduce((sum, block) => sum + block.height, 0);
  if (blocks.length > 1 && total <= CONTENT_H) {
    return [{
      height: total,
      draw(y) {
        let cursor = y;
        for (const block of blocks) {
          block.draw(cursor);
          cursor += block.height;
        }
      },
    }];
  }

  return blocks;
}

function drawBlocks(doc: jsPDF, blocks: Block[]): void {
  const pages = paginateBlocks(blocks.map((block) => block.height), CONTENT_H);
  let y = CONTENT_TOP;
  let page = 0;
  blocks.forEach((block, index) => {
    if (pages[index] !== page) {
      doc.addPage();
      page = pages[index];
      y = CONTENT_TOP;
    }
    block.draw(y);
    y += block.height;
  });
}

function readingBlocks(doc: jsPDF, reading: ReadingResult, images: PdfImage[]): Block[] {
  const blocks: Block[] = [layoutIntro(doc, reading)];
  cardsOf(reading, images).forEach((card, index) => {
    blocks.push(...layoutReadingCard(doc, card, index));
  });
  blocks.push(...layoutSynthesis(doc, reading));
  return blocks;
}

export function readingSectionHeights(reading: ReadingResult, images: PdfImage[], fonts: PdfFonts): number[] {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  registerPdfFonts(doc, fonts);
  return readingBlocks(doc, reading, images).map((block) => block.height);
}

export function createReadingPdf(reading: ReadingResult, images: PdfImage[], fonts: PdfFonts): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  registerPdfFonts(doc, fonts);
  drawBlocks(doc, readingBlocks(doc, reading, images));
  paintChrome(doc);
  return doc;
}

function layoutPrintCard(doc: jsPDF, card: CardSource): Block {
  const nameLines = wrap(doc, card.name, CARD_IMG_W + 48, SANS, 'bold', 16);
  const shownName = nameLines.length ? nameLines : [card.name || 'Card'];
  const hasCaption = Boolean(card.position || card.reversed);
  const groupH = CARD_IMG_H + 36 + shownName.length * 20 + (hasCaption ? 18 : 0);

  return {
    height: CONTENT_H,
    draw(y) {
      const top = y + Math.max(0, (CONTENT_H - groupH) / 2);
      const x = (PAGE_W - CARD_IMG_W) / 2;
      drawImageOrPlaceholder(doc, card.image, x, top, CARD_IMG_W, CARD_IMG_H, card.name);
      let baseline = top + CARD_IMG_H + 36;
      doc.setFont(SANS, 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...FG);
      for (const line of shownName) {
        doc.text(line, PAGE_W / 2, baseline, { align: 'center' });
        baseline += 20;
      }
      if (hasCaption) drawCardCaption(doc, card, baseline);
    },
  };
}

function drawCardCaption(doc: jsPDF, card: CardSource, baseline: number): void {
  doc.setFont(MONO, 'normal');
  doc.setFontSize(10);
  const position = card.position;
  const reversed = card.reversed ? 'Reversed' : '';
  const gap = position && reversed ? '  ·  ' : '';
  const positionW = position ? doc.getTextWidth(position) : 0;
  const gapW = gap ? doc.getTextWidth(gap) : 0;
  const reversedW = reversed ? doc.getTextWidth(reversed) : 0;
  let cursor = (PAGE_W - (positionW + gapW + reversedW)) / 2;
  if (position) {
    doc.setTextColor(...MUTED);
    doc.text(position, cursor, baseline);
    cursor += positionW;
  }
  if (gap) {
    doc.setTextColor(...MUTED);
    doc.text(gap, cursor, baseline);
    cursor += gapW;
  }
  if (reversed) {
    doc.setTextColor(...ACCENT);
    doc.text(reversed, cursor, baseline);
  }
}

export function createCardsPdf(reading: ReadingResult, images: PdfImage[], fonts: PdfFonts): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  registerPdfFonts(doc, fonts);
  const cards = cardsOf(reading, images);
  const blocks: Block[] = cards.length
    ? cards.map((card) => layoutPrintCard(doc, card))
    : [{
        height: 40,
        draw(y) {
          doc.setFont(SANS, 'normal');
          doc.setFontSize(13);
          doc.setTextColor(...MUTED);
          doc.text('No cards in this reading.', MARGIN_X, y + 16);
        },
      }];
  drawBlocks(doc, blocks);
  paintChrome(doc);
  return doc;
}

async function fetchImageAsJpeg(imageUrl: string): Promise<string | null> {
  try {
    const proxyUrl = apiUrl(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 512;
          canvas.height = img.naturalHeight || 768;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}

async function fetchImagesPooled(cards: ReadingResult['cards'], concurrency = 3): Promise<PdfImage[]> {
  const results: PdfImage[] = new Array(cards.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < cards.length) {
      const index = next++;
      const url = cards[index]?.imageUrl;
      if (!url || url === 'failed') continue;
      results[index] = await fetchImageAsJpeg(url);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, cards.length) }, worker));
  return results;
}

function savePdf(doc: jsPDF, filename: string): void {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function fileDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'reading';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function downloadReadingPDF(reading: ReadingResult): Promise<void> {
  const fonts = await loadPdfFonts();
  const images = await fetchImagesPooled(reading.cards);
  savePdf(createReadingPdf(reading, images, fonts), `Reading ${fileDate(reading.date)}.pdf`);
}

export async function downloadCardsPDF(reading: ReadingResult): Promise<void> {
  const fonts = await loadPdfFonts();
  const images = await fetchImagesPooled(reading.cards);
  savePdf(createCardsPdf(reading, images, fonts), `Cards ${fileDate(reading.date)}.pdf`);
}
