import { ReadingResult } from './types';

const GOLD: [number, number, number] = [196, 146, 42];
const DARK_BROWN: [number, number, number] = [42, 31, 20];
const MID_BROWN: [number, number, number] = [122, 92, 69];
const CREAM: [number, number, number] = [253, 250, 246];
const PARCHMENT: [number, number, number] = [245, 237, 216];

async function imageToBase64(url: string): Promise<string | null> {
  try {
    // Use Next.js image optimizer (same-origin, no CORS issues)
    const optimizedUrl = `/_next/image?url=${encodeURIComponent(url)}&w=512&q=80`;
    const res = await fetch(optimizedUrl);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function addPage(doc: import('jspdf').jsPDF, pageW: number, pageH: number) {
  doc.addPage();
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageW, pageH, 'F');
}

function checkPageBreak(doc: import('jspdf').jsPDF, y: number, needed: number, pageW: number, pageH: number, margin: number): number {
  if (y + needed > pageH - margin) {
    addPage(doc, pageW, pageH);
    return margin;
  }
  return y;
}

function addGoldDivider(doc: import('jspdf').jsPDF, y: number, margin: number, pageW: number) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
}

/** Download a full reading as a formatted PDF */
export async function downloadReadingPDF(reading: ReadingResult): Promise<void> {
  const { jsPDF } = await import('jspdf');

  // Load all card images in parallel
  const cardImages = await Promise.all(
    reading.cards.map(c => c.imageUrl ? imageToBase64(c.imageUrl) : Promise.resolve(null))
  );

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageW = 612;
  const pageH = 792;
  const margin = 56;
  const textW = pageW - margin * 2;

  // Background
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageW, pageH, 'F');

  let y = margin;

  // ── Header ──────────────────────────────────────────────
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.text('✦  TAROT · AI', pageW / 2, y, { align: 'center' });

  y += 14;
  const dateStr = new Date(reading.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFontSize(8);
  doc.setTextColor(...MID_BROWN);
  doc.text(dateStr, pageW / 2, y, { align: 'center' });

  y += 16;
  addGoldDivider(doc, y, margin, pageW);
  y += 18;

  // Question
  if (reading.question) {
    doc.setFont('times', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(...DARK_BROWN);
    const qLines = doc.splitTextToSize(`"${reading.question}"`, textW - 20);
    doc.text(qLines, pageW / 2, y, { align: 'center' });
    y += qLines.length * 18 + 12;
  }

  // ── Card images ─────────────────────────────────────────
  const cardCount = reading.cards.length;
  const cardW = Math.min(80, (textW - (cardCount - 1) * 10) / cardCount);
  const cardH = cardW * 1.5;
  const totalW = cardCount * cardW + (cardCount - 1) * 10;
  let cx = (pageW - totalW) / 2;

  for (let i = 0; i < cardCount; i++) {
    const img = cardImages[i];
    if (img) {
      doc.addImage(img, 'JPEG', cx, y, cardW, cardH);
      // Reversed overlay indicator
      if (reading.cards[i].reversed) {
        doc.setFont('times', 'italic');
        doc.setFontSize(6);
        doc.setTextColor(...GOLD);
        doc.text('↻ rev.', cx + cardW / 2, y + cardH + 8, { align: 'center' });
      }
    } else {
      doc.setFillColor(...PARCHMENT);
      doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'F');
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.5);
      doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'S');
      doc.setFont('times', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...MID_BROWN);
      const nameLines = doc.splitTextToSize(reading.cards[i].card.name, cardW - 8);
      doc.text(nameLines, cx + cardW / 2, y + cardH / 2, { align: 'center' });
    }
    // Position label
    doc.setFont('times', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(...MID_BROWN);
    doc.text(reading.cards[i].position, cx + cardW / 2, y + cardH + (reading.cards[i].reversed ? 16 : 10), { align: 'center' });
    cx += cardW + 10;
  }

  y += cardH + 24;
  addGoldDivider(doc, y, margin, pageW);
  y += 16;

  // ── Overall Energy ───────────────────────────────────────
  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GOLD);
  doc.text('THE ENERGY OF THIS READING', pageW / 2, y, { align: 'center' });
  y += 13;

  doc.setFont('times', 'italic');
  doc.setFontSize(11.5);
  doc.setTextColor(...DARK_BROWN);
  const oeLines = doc.splitTextToSize(reading.overallEnergy, textW);
  doc.text(oeLines, pageW / 2, y, { align: 'center' });
  y += oeLines.length * 15 + 18;

  // ── Card Readings ────────────────────────────────────────
  for (let i = 0; i < reading.cardReadings.length; i++) {
    const cr = reading.cardReadings[i];
    y = checkPageBreak(doc, y, 120, pageW, pageH, margin);

    doc.setDrawColor(220, 210, 195);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 13;

    // Roman numeral
    const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X'][i] ?? `${i + 1}`;
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GOLD);
    doc.text(roman, margin, y);

    // Card name
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...DARK_BROWN);
    const cardLabel = cr.card + (reading.cards[i]?.reversed ? ' · Reversed' : '');
    doc.text(cardLabel, margin + 18, y);

    // Position
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...MID_BROWN);
    doc.text(cr.position, margin + 18, y + 13);
    y += 26;

    // Keywords
    if (cr.keywords?.length) {
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...MID_BROWN);
      doc.text(cr.keywords.join('  ·  '), margin, y);
      y += 13;
    }

    // Interpretation
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK_BROWN);
    const interpLines = doc.splitTextToSize(cr.interpretation, textW);
    for (const line of interpLines) {
      y = checkPageBreak(doc, y, 14, pageW, pageH, margin);
      doc.text(line, margin, y);
      y += 14;
    }
    y += 10;
  }

  // ── Synthesis ────────────────────────────────────────────
  y = checkPageBreak(doc, y, 140, pageW, pageH, margin);
  addGoldDivider(doc, y, margin, pageW);
  y += 16;

  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GOLD);
  doc.text('WHAT THE CARDS SAY TOGETHER', pageW / 2, y, { align: 'center' });
  y += 13;

  doc.setFont('times', 'italic');
  doc.setFontSize(11.5);
  doc.setTextColor(...DARK_BROWN);
  const synLines = doc.splitTextToSize(reading.synthesis, textW);
  doc.text(synLines, pageW / 2, y, { align: 'center' });
  y += synLines.length * 15 + 22;

  // ── Affirmation ──────────────────────────────────────────
  y = checkPageBreak(doc, y, 50, pageW, pageH, margin);
  doc.setFont('times', 'italic');
  doc.setFontSize(14);
  doc.setTextColor(...GOLD);
  const affLines = doc.splitTextToSize(`"${reading.affirmation}"`, textW - 40);
  doc.text(affLines, pageW / 2, y, { align: 'center' });
  y += affLines.length * 19 + 16;

  // ── Notable Timing ───────────────────────────────────────
  if (reading.notableTiming) {
    y = checkPageBreak(doc, y, 30, pageW, pageH, margin);
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...MID_BROWN);
    const timingLines = doc.splitTextToSize(`☽  ${reading.notableTiming}`, textW);
    doc.text(timingLines, pageW / 2, y, { align: 'center' });
  }

  // ── Footer on every page ─────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text('✦  TAROT · AI', pageW / 2, pageH - 22, { align: 'center' });
    if (pageCount > 1) {
      doc.setFontSize(6.5);
      doc.setTextColor(...MID_BROWN);
      doc.text(`${p} / ${pageCount}`, pageW - margin, pageH - 22, { align: 'right' });
    }
  }

  const filename = `tarot-reading-${new Date(reading.date).toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/** Download card images at print-ready tarot size (2.75" × 4.75") */
export async function downloadCardsPDF(reading: ReadingResult): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const cardImages = await Promise.all(
    reading.cards.map(c => c.imageUrl ? imageToBase64(c.imageUrl) : Promise.resolve(null))
  );

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageW = 612;
  const pageH = 792;
  const margin = 36;

  // Tarot card: 2.75" × 4.75" at 72pt/inch
  const cardW = 198;
  const cardH = 342;
  const cols = 3;
  const labelH = 22;
  const gutterX = (pageW - margin * 2 - cols * cardW) / (cols - 1);
  const gutterY = 16;

  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Header
  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GOLD);
  doc.text('✦  TAROT · AI  —  PRINT & PLAY', pageW / 2, 22, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(...MID_BROWN);
  doc.text('Cut along card edges. Standard tarot size: 2.75" × 4.75"', pageW / 2, 31, { align: 'center' });

  let col = 0;
  let row = 0;
  let pageInitialized = true;

  for (let i = 0; i < reading.cards.length; i++) {
    const x = margin + col * (cardW + gutterX);
    const y = 42 + row * (cardH + labelH + gutterY);

    // Check if this card overflows the page
    if (y + cardH + labelH > pageH - margin) {
      doc.addPage();
      doc.setFillColor(...CREAM);
      doc.rect(0, 0, pageW, pageH, 'F');
      col = 0;
      row = 0;
      pageInitialized = false;
      i--; // re-process this card on new page
      continue;
    }

    const img = cardImages[i];
    if (img) {
      if (reading.cards[i].reversed) {
        // Draw reversed card rotated 180°
        doc.context2d?.save();
        doc.addImage(img, 'JPEG', x, y, cardW, cardH, undefined, 'NONE', 180);
      } else {
        doc.addImage(img, 'JPEG', x, y, cardW, cardH);
      }
    } else {
      doc.setFillColor(...PARCHMENT);
      doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...MID_BROWN);
      const nameLines = doc.splitTextToSize(reading.cards[i].card.name, cardW - 16);
      doc.text(nameLines, x + cardW / 2, y + cardH / 2, { align: 'center' });
    }

    // Cut border
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'S');

    // Label
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK_BROWN);
    doc.text(reading.cards[i].card.name, x + cardW / 2, y + cardH + 10, { align: 'center' });

    doc.setFont('times', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...MID_BROWN);
    const posLabel = reading.cards[i].position + (reading.cards[i].reversed ? ' · Reversed' : '');
    doc.text(posLabel, x + cardW / 2, y + cardH + 19, { align: 'center' });

    col++;
    if (col >= cols) {
      col = 0;
      row++;
    }
  }

  const filename = `tarot-cards-${new Date(reading.date).toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
