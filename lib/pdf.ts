import { ReadingResult } from './types';

const GOLD: [number, number, number] = [196, 146, 42];
const DARK_BROWN: [number, number, number] = [42, 31, 20];
const MID_BROWN: [number, number, number] = [122, 92, 69];
const CREAM: [number, number, number] = [253, 250, 246];
const PARCHMENT: [number, number, number] = [245, 237, 216];
const PARCHMENT_DARK: [number, number, number] = [237, 229, 208];

async function imageToBase64(url: string): Promise<string | null> {
  try {
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

type jsPDFType = import('jspdf').jsPDF;

function drawPageChrome(doc: jsPDFType, pageW: number, pageH: number) {
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageW, pageH, 'F');
  // Outer gold border
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageW - 20, pageH - 20, 'S');
  // Inner hairline
  doc.setLineWidth(0.25);
  doc.rect(14, 14, pageW - 28, pageH - 28, 'S');
}

function newPage(doc: jsPDFType, pageW: number, pageH: number) {
  doc.addPage();
  drawPageChrome(doc, pageW, pageH);
}

function checkBreak(
  doc: jsPDFType,
  y: number,
  needed: number,
  pageW: number,
  pageH: number,
  margin: number,
): number {
  if (y + needed > pageH - margin - 18) {
    newPage(doc, pageW, pageH);
    return margin;
  }
  return y;
}

function goldRule(doc: jsPDFType, x1: number, y: number, x2: number, w = 0.4) {
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(w);
  doc.line(x1, y, x2, y);
}

function sectionLabel(
  doc: jsPDFType,
  text: string,
  cx: number,
  y: number,
  align: 'center' | 'left' = 'center',
) {
  doc.setFont('times', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...GOLD);
  doc.text(text, cx, y, { align, charSpace: 2.5 });
}

/** Full reading PDF — beautifully typeset, print-ready */
export async function downloadReadingPDF(reading: ReadingResult): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const cardImages = await Promise.all(
    reading.cards.map(c => c.imageUrl ? imageToBase64(c.imageUrl) : Promise.resolve(null)),
  );

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageW = 612;
  const pageH = 792;
  const margin = 52;
  const textW = pageW - margin * 2;

  // ── PAGE 1: Cover spread ─────────────────────────────────
  drawPageChrome(doc, pageW, pageH);
  let y = margin + 6;

  // Wordmark
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text('T A R O T  ·  A I', pageW / 2, y, { align: 'center', charSpace: 3 });
  y += 14;

  const dateStr = new Date(reading.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setFontSize(7.5);
  doc.setTextColor(...MID_BROWN);
  doc.text(dateStr, pageW / 2, y, { align: 'center' });
  y += 18;

  goldRule(doc, margin, y, pageW - margin, 0.6);
  y += 4;

  // Corner ornaments
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.text('✦', margin + 4, y + 4);
  doc.text('✦', pageW - margin - 4, y + 4, { align: 'right' });
  y += 14;

  // Spread label
  const spreadNames: Record<string, string> = {
    single: 'SINGLE CARD',
    three: 'THREE-CARD SPREAD',
    five: 'FIVE-CARD SPREAD',
    'celtic-cross': 'CELTIC CROSS',
  };
  sectionLabel(doc, spreadNames[reading.spreadType] ?? 'TAROT SPREAD', pageW / 2, y);
  y += 18;

  // Question
  if (reading.question) {
    doc.setFont('times', 'italic');
    doc.setFontSize(15);
    doc.setTextColor(...DARK_BROWN);
    const qLines = doc.splitTextToSize(`\u201c${reading.question}\u201d`, textW - 40);
    doc.text(qLines, pageW / 2, y, { align: 'center' });
    y += qLines.length * 20 + 8;
  }

  y += 6;
  goldRule(doc, margin + 40, y, pageW - margin - 40, 0.3);
  y += 18;

  // ── Card images on cover page ─────────────────────────────
  const cardCount = reading.cards.length;
  const isCeltic = cardCount === 10;

  if (isCeltic) {
    // Celtic Cross: two rows of 5
    const cw = 74; const ch = cw * 1.5;
    const gap = (textW - 5 * cw) / 4;
    for (let row = 0; row < 2; row++) {
      const rowStart = row * 5;
      const rowEnd = Math.min(rowStart + 5, cardCount);
      const rowCount = rowEnd - rowStart;
      const rowW = rowCount * cw + (rowCount - 1) * gap;
      let cx = (pageW - rowW) / 2;
      for (let i = rowStart; i < rowEnd; i++) {
        const img = cardImages[i];
        if (img) {
          doc.addImage(img, 'JPEG', cx, y, cw, ch);
        } else {
          doc.setFillColor(...PARCHMENT);
          doc.roundedRect(cx, y, cw, ch, 2, 2, 'F');
          doc.setDrawColor(...GOLD);
          doc.setLineWidth(0.4);
          doc.roundedRect(cx, y, cw, ch, 2, 2, 'S');
          doc.setFontSize(6); doc.setFont('times', 'normal'); doc.setTextColor(...MID_BROWN);
          const nl = doc.splitTextToSize(reading.cards[i].card.name, cw - 8);
          doc.text(nl, cx + cw / 2, y + ch / 2, { align: 'center' });
        }
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.35);
        doc.roundedRect(cx, y, cw, ch, 2, 2, 'S');
        // position label
        doc.setFont('times', 'italic'); doc.setFontSize(6); doc.setTextColor(...MID_BROWN);
        const posLabel = reading.cards[i].position + (reading.cards[i].reversed ? ' ↻' : '');
        const pLines = doc.splitTextToSize(posLabel, cw + 4);
        doc.text(pLines[0], cx + cw / 2, y + ch + 9, { align: 'center' });
        cx += cw + gap;
      }
      y += ch + 20;
    }
  } else {
    // 1–5 cards: single row, proportional sizing
    const maxCw = cardCount === 1 ? 170 : cardCount <= 3 ? 128 : 92;
    const cw = Math.min(maxCw, (textW - (cardCount - 1) * 14) / cardCount);
    const ch = cw * 1.575;
    const totalW = cardCount * cw + (cardCount - 1) * 14;
    let cx = (pageW - totalW) / 2;

    for (let i = 0; i < cardCount; i++) {
      const img = cardImages[i];
      if (img) {
        doc.addImage(img, 'JPEG', cx, y, cw, ch);
      } else {
        doc.setFillColor(...PARCHMENT);
        doc.roundedRect(cx, y, cw, ch, 3, 3, 'F');
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
        doc.roundedRect(cx, y, cw, ch, 3, 3, 'S');
        doc.setFontSize(7.5); doc.setFont('times', 'normal'); doc.setTextColor(...MID_BROWN);
        const nl = doc.splitTextToSize(reading.cards[i].card.name, cw - 10);
        doc.text(nl, cx + cw / 2, y + ch / 2, { align: 'center' });
      }
      // Gold frame over image
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
      doc.roundedRect(cx, y, cw, ch, 3, 3, 'S');

      // Card name + reversed badge
      doc.setFont('times', 'bold'); doc.setFontSize(7); doc.setTextColor(...DARK_BROWN);
      const nameLines = doc.splitTextToSize(reading.cards[i].card.name, cw + 8);
      doc.text(nameLines[0], cx + cw / 2, y + ch + 11, { align: 'center' });

      doc.setFont('times', 'italic'); doc.setFontSize(6.5); doc.setTextColor(...MID_BROWN);
      const posLabel = reading.cards[i].position + (reading.cards[i].reversed ? '  ↻ Rev.' : '');
      const pLines = doc.splitTextToSize(posLabel, cw + 8);
      doc.text(pLines[0], cx + cw / 2, y + ch + 20, { align: 'center' });

      cx += cw + 14;
    }
    y += ch + 32;
  }

  goldRule(doc, margin + 20, y, pageW - margin - 20, 0.3);
  y += 16;

  // Overall Energy
  sectionLabel(doc, 'THE ENERGY OF THIS READING', pageW / 2, y);
  y += 14;

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_BROWN);
  const oeLines = doc.splitTextToSize(reading.overallEnergy, textW - 20);

  // If it doesn't fit on page 1, start page 2 for the energy
  y = checkBreak(doc, y, oeLines.length * 15 + 10, pageW, pageH, margin);
  doc.text(oeLines, pageW / 2, y, { align: 'center' });
  y += oeLines.length * 15 + 20;

  // ── CARD READINGS ────────────────────────────────────────
  const roman = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  const thumbW = 96;
  const thumbH = thumbW * 1.575;
  const textCol = margin + thumbW + 16;
  const textColW = pageW - margin - thumbW - 16 - margin;

  for (let i = 0; i < reading.cardReadings.length; i++) {
    const cr = reading.cardReadings[i];
    const sectionNeeded = thumbH + 24;
    y = checkBreak(doc, y, sectionNeeded, pageW, pageH, margin);

    const sectionTop = y;

    // Parchment background for entire card section
    const estimatedH = thumbH + 20;
    doc.setFillColor(...PARCHMENT);
    doc.roundedRect(margin - 6, y - 6, textW + 12, estimatedH, 3, 3, 'F');

    // Thumbnail
    const img = cardImages[i];
    if (img) {
      doc.addImage(img, 'JPEG', margin, y, thumbW, thumbH);
    } else {
      doc.setFillColor(...PARCHMENT_DARK);
      doc.roundedRect(margin, y, thumbW, thumbH, 2, 2, 'F');
      doc.setFont('times', 'normal'); doc.setFontSize(7); doc.setTextColor(...MID_BROWN);
      const nl = doc.splitTextToSize(cr.card, thumbW - 8);
      doc.text(nl, margin + thumbW / 2, y + thumbH / 2, { align: 'center' });
    }
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, thumbW, thumbH, 2, 2, 'S');

    // Card header (right column)
    let ry = y + 2;

    // Roman numeral + card name
    doc.setFont('times', 'normal'); doc.setFontSize(8); doc.setTextColor(...GOLD);
    doc.text(roman[i] ?? `${i + 1}`, textCol, ry);

    doc.setFont('times', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...DARK_BROWN);
    const cardLabel = cr.card + (reading.cards[i]?.reversed ? '  ·  Reversed' : '');
    doc.text(cardLabel, textCol + 14, ry);
    ry += 16;

    // Position
    doc.setFont('times', 'italic'); doc.setFontSize(9.5); doc.setTextColor(...MID_BROWN);
    doc.text(cr.position, textCol, ry);
    ry += 14;

    // Keywords
    if (cr.keywords?.length) {
      doc.setFont('times', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GOLD);
      doc.text(cr.keywords.join('  ·  '), textCol, ry);
      ry += 13;
    }

    ry += 2;
    // Thin rule before interpretation
    doc.setDrawColor(200, 185, 165); doc.setLineWidth(0.25);
    doc.line(textCol, ry, pageW - margin, ry);
    ry += 9;

    // Interpretation — may overflow past thumbnail
    doc.setFont('times', 'normal'); doc.setFontSize(10); doc.setTextColor(...DARK_BROWN);
    const interpLines = doc.splitTextToSize(cr.interpretation, textColW);

    for (const line of interpLines) {
      // If we're below the thumbnail, use full width
      const lineX = ry < sectionTop + thumbH + 8 ? textCol : margin;
      const lineW = ry < sectionTop + thumbH + 8 ? textColW : textW;

      if (ry > sectionTop + thumbH + 8 && lineX === margin) {
        // Re-flow text at full width if we've passed the thumbnail
        // (handled by lineX already being margin)
      }

      y = checkBreak(doc, ry, 13, pageW, pageH, margin);
      if (y !== ry) {
        // Went to new page — redraw parchment bg and reset positions
        ry = y;
        doc.setFillColor(...PARCHMENT);
        doc.roundedRect(margin - 6, ry - 6, textW + 12, 24, 3, 3, 'F');
      }
      ry = y;

      doc.setFont('times', 'normal'); doc.setFontSize(10); doc.setTextColor(...DARK_BROWN);
      doc.text(line, lineX, ry);
      ry += 14;
    }

    y = Math.max(ry, sectionTop + thumbH + 8);
    y += 14;

    // Thin divider between cards
    if (i < reading.cardReadings.length - 1) {
      y = checkBreak(doc, y, 12, pageW, pageH, margin);
      doc.setDrawColor(214, 200, 178); doc.setLineWidth(0.25);
      doc.line(margin + 20, y, pageW - margin - 20, y);
      y += 14;
    }
  }

  // ── SYNTHESIS ────────────────────────────────────────────
  y = checkBreak(doc, y, 160, pageW, pageH, margin);
  y += 8;
  goldRule(doc, margin, y, pageW - margin, 0.5);
  y += 6;
  // corner stars
  doc.setFont('times', 'normal'); doc.setFontSize(8); doc.setTextColor(...GOLD);
  doc.text('✦', margin + 4, y + 4);
  doc.text('✦', pageW - margin - 4, y + 4, { align: 'right' });
  y += 14;

  sectionLabel(doc, 'WHAT THE CARDS SAY TOGETHER', pageW / 2, y);
  y += 16;

  doc.setFont('times', 'italic'); doc.setFontSize(11.5); doc.setTextColor(...DARK_BROWN);
  const synLines = doc.splitTextToSize(reading.synthesis, textW - 20);
  for (const line of synLines) {
    y = checkBreak(doc, y, 16, pageW, pageH, margin);
    doc.text(line, pageW / 2, y, { align: 'center' });
    y += 16;
  }
  y += 12;

  // ── AFFIRMATION ──────────────────────────────────────────
  y = checkBreak(doc, y, 60, pageW, pageH, margin);

  // Parchment pill for affirmation
  const affText = `\u201c${reading.affirmation}\u201d`;
  doc.setFont('times', 'italic'); doc.setFontSize(13.5); doc.setTextColor(...GOLD);
  const affLines = doc.splitTextToSize(affText, textW - 60);
  const affH = affLines.length * 19 + 20;
  doc.setFillColor(...PARCHMENT);
  doc.roundedRect(margin + 10, y - 8, textW - 20, affH, 4, 4, 'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.35);
  doc.roundedRect(margin + 10, y - 8, textW - 20, affH, 4, 4, 'S');

  doc.text(affLines, pageW / 2, y + 6, { align: 'center' });
  y += affH + 8;

  // ── NOTABLE TIMING ───────────────────────────────────────
  if (reading.notableTiming) {
    y = checkBreak(doc, y, 36, pageW, pageH, margin);
    y += 4;
    doc.setFont('times', 'italic'); doc.setFontSize(9); doc.setTextColor(...MID_BROWN);
    const timingLines = doc.splitTextToSize(`\u2609  ${reading.notableTiming}`, textW - 40);
    doc.text(timingLines, pageW / 2, y, { align: 'center' });
    y += timingLines.length * 13 + 8;
  }

  // ── FOOTER ON EVERY PAGE ─────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('times', 'normal'); doc.setFontSize(7); doc.setTextColor(...GOLD);
    doc.text('\u2736  TAROT \u00b7 AI  \u2736', pageW / 2, pageH - 24, { align: 'center' });
    if (pageCount > 1) {
      doc.setFontSize(6.5); doc.setTextColor(...MID_BROWN);
      doc.text(`${p} \u2F2F ${pageCount}`, pageW - margin + 4, pageH - 24, { align: 'right' });
    }
  }

  const filename = `tarot-reading-${new Date(reading.date).toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/** Print-ready cards PDF — tarot size 2.75" × 4.75" */
export async function downloadCardsPDF(reading: ReadingResult): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const cardImages = await Promise.all(
    reading.cards.map(c => c.imageUrl ? imageToBase64(c.imageUrl) : Promise.resolve(null)),
  );

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageW = 612;
  const pageH = 792;
  const margin = 36;

  const cardW = 198; // 2.75" at 72pt/in
  const cardH = 342; // 4.75" at 72pt/in
  const cols = 3;
  const labelH = 24;
  const gutterX = (pageW - margin * 2 - cols * cardW) / (cols - 1);
  const gutterY = 18;

  function initPage() {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, pageW, pageH, 'F');
    // Page border
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.7);
    doc.rect(8, 8, pageW - 16, pageH - 16, 'S');
    doc.setLineWidth(0.25);
    doc.rect(12, 12, pageW - 24, pageH - 24, 'S');
  }

  initPage();

  doc.setFont('times', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GOLD);
  doc.text('\u2736  TAROT \u00b7 AI  \u2014  PRINT & CUT', pageW / 2, 26, { align: 'center', charSpace: 1.5 });
  doc.setFontSize(6.5); doc.setTextColor(...MID_BROWN);
  doc.text('Standard tarot size \u00b7 2.75\u2033 \u00d7 4.75\u2033 \u00b7 Cut along gold borders', pageW / 2, 35, { align: 'center' });

  let col = 0;
  let row = 0;

  for (let i = 0; i < reading.cards.length; i++) {
    const x = margin + col * (cardW + gutterX);
    const y = 46 + row * (cardH + labelH + gutterY);

    if (y + cardH + labelH > pageH - margin - 10) {
      doc.addPage();
      initPage();
      col = 0; row = 0;
      i--;
      continue;
    }

    const img = cardImages[i];
    if (img) {
      if (reading.cards[i].reversed) {
        doc.addImage(img, 'JPEG', x, y, cardW, cardH, undefined, 'NONE', 180);
      } else {
        doc.addImage(img, 'JPEG', x, y, cardW, cardH);
      }
    } else {
      doc.setFillColor(...PARCHMENT);
      doc.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
      doc.setFont('times', 'normal'); doc.setFontSize(11); doc.setTextColor(...MID_BROWN);
      const nl = doc.splitTextToSize(reading.cards[i].card.name, cardW - 20);
      doc.text(nl, x + cardW / 2, y + cardH / 2, { align: 'center' });
    }

    // Gold cut border
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.5);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'S');

    // Labels
    doc.setFont('times', 'bold'); doc.setFontSize(9); doc.setTextColor(...DARK_BROWN);
    doc.text(reading.cards[i].card.name, x + cardW / 2, y + cardH + 12, { align: 'center' });

    doc.setFont('times', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...MID_BROWN);
    const posLabel = reading.cards[i].position + (reading.cards[i].reversed ? '  ·  Reversed' : '');
    doc.text(posLabel, x + cardW / 2, y + cardH + 22, { align: 'center' });

    col++;
    if (col >= cols) { col = 0; row++; }
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('times', 'normal'); doc.setFontSize(7); doc.setTextColor(...GOLD);
    doc.text('\u2736  TAROT \u00b7 AI  \u2736', pageW / 2, pageH - 22, { align: 'center' });
    if (pageCount > 1) {
      doc.setFontSize(6.5); doc.setTextColor(...MID_BROWN);
      doc.text(`${p} / ${pageCount}`, pageW - margin, pageH - 22, { align: 'right' });
    }
  }

  const filename = `tarot-cards-${new Date(reading.date).toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
