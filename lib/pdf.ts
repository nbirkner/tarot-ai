import { ReadingResult } from './types';

// ── Palette ───────────────────────────────────────────────────────────────────
const GOLD: [number, number, number]         = [196, 146, 42];
const DARK_BROWN: [number, number, number]   = [42, 31, 20];
const MID_BROWN: [number, number, number]    = [122, 92, 69];
const CREAM: [number, number, number]        = [253, 250, 246];
const PARCHMENT: [number, number, number]    = [245, 237, 216];
const PARCHMENT_DARK: [number, number, number] = [237, 229, 208];

// ── Unicode sanitizer ─────────────────────────────────────────────────────────
// jsPDF built-in fonts (helvetica, times, courier) only support Latin-1.
// Anything outside that range -- curly quotes, em dashes, bullets, ✦, etc. --
// renders as "?" or garbled bytes. Sanitize every string before passing to jsPDF.
function sanitize(text: string): string {
  if (!text) return '';
  return text
    // Smart quotes -> straight quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Em dash / en dash -> hyphen
    .replace(/[\u2013\u2014]/g, '-')
    // Ellipsis character -> three dots
    .replace(/\u2026/g, '...')
    // Common decorative chars
    .replace(/\u2022/g, '-')   // bullet •
    .replace(/\u00B7/g, '-')   // middle dot ·
    .replace(/\u2605/g, '*')   // black star ★
    .replace(/\u2606/g, '*')   // white star ☆
    .replace(/\u2728/g, '*')   // sparkles ✨
    .replace(/\u2734/g, '*')   // eight pointed star ✴
    .replace(/\u2736/g, '*')   // six pointed star ✶
    .replace(/\u2739/g, '*')   // twelve pointed star ✹
    .replace(/\u2726/g, '*')   // four pointed star ✦
    .replace(/\u2746/g, '*')   // asterisk ❆
    .replace(/\u27B8/g, '*')   // heavy arrow
    .replace(/[^\u0000-\u00FF]/g, '') // strip anything outside Latin-1
    .trim();
}

// ── Canvas-based image loader ─────────────────────────────────────────────────
// jsPDF only renders JPEG and PNG. /_next/image returns WebP to modern browsers,
// which jsPDF silently ignores. We must fetch -> blob -> canvas -> JPEG ourselves.
async function imageToBase64(url: string): Promise<string | null> {
  try {
    // Route through Next.js image optimizer proxy so:
    //   (a) We get the image regardless of CORS on the CDN origin
    //   (b) The response is cached/optimized
    const proxyUrl = `/_next/image?url=${encodeURIComponent(url)}&w=512&q=85`;

    const res = await fetch(proxyUrl, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const blob = await res.blob();

    return await new Promise<string | null>((resolve) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();

      // Must set crossOrigin BEFORE src when the canvas needs to be read.
      // (blob: URLs are same-origin, but setting it doesn't hurt.)
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        try {
          const w = img.naturalWidth  || 512;
          const h = img.naturalHeight || 768;

          const canvas = document.createElement('canvas');
          canvas.width  = w;
          canvas.height = h;

          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(null); return; }

          // White background so transparent PNGs don't go black
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0);

          resolve(canvas.toDataURL('image/jpeg', 0.85));
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

// ── jsPDF type alias ───────────────────────────────────────────────────────────
type jsPDFType = import('jspdf').jsPDF;

// ── Page chrome ───────────────────────────────────────────────────────────────
function drawPageChrome(doc: jsPDFType, pageW: number, pageH: number) {
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageW, pageH, 'F');
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.rect(10, 10, pageW - 20, pageH - 20, 'S');
  doc.setLineWidth(0.25);
  doc.rect(14, 14, pageW - 28, pageH - 28, 'S');
}

function newPage(doc: jsPDFType, pageW: number, pageH: number): void {
  doc.addPage();
  drawPageChrome(doc, pageW, pageH);
}

// Returns updated y, possibly after adding a page break.
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
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...GOLD);
  doc.text(sanitize(text), cx, y, { align, charSpace: 2.5 });
}

// ── Main reading PDF ───────────────────────────────────────────────────────────
export async function downloadReadingPDF(reading: ReadingResult): Promise<void> {
  const { jsPDF } = await import('jspdf');

  // Preload ALL card images in parallel before building the doc
  const cardImages = await Promise.all(
    reading.cards.map(c => c.imageUrl ? imageToBase64(c.imageUrl) : Promise.resolve(null)),
  );

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageW  = 612;
  const pageH  = 792;
  const margin = 52;
  const textW  = pageW - margin * 2;

  // ── PAGE 1: Cover ────────────────────────────────────────────────────────────
  drawPageChrome(doc, pageW, pageH);
  let y = margin + 6;

  // Wordmark
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GOLD);
  doc.text('T A R O T  A I', pageW / 2, y, { align: 'center', charSpace: 3 });
  y += 14;

  // Date
  const dateStr = sanitize(
    new Date(reading.date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MID_BROWN);
  doc.text(dateStr, pageW / 2, y, { align: 'center' });
  y += 18;

  goldRule(doc, margin, y, pageW - margin, 0.6);
  y += 16;

  // Spread type label
  const spreadNames: Record<string, string> = {
    single:       'SINGLE CARD',
    three:        'THREE-CARD SPREAD',
    five:         'FIVE-CARD SPREAD',
    celtic:       'CELTIC CROSS',
    'celtic-cross': 'CELTIC CROSS',
  };
  sectionLabel(doc, spreadNames[reading.spreadType] ?? 'TAROT SPREAD', pageW / 2, y);
  y += 18;

  // Question
  if (reading.question) {
    doc.setFont('times', 'italic');
    doc.setFontSize(15);
    doc.setTextColor(...DARK_BROWN);
    const qText  = sanitize(`"${reading.question}"`);
    const qLines = doc.splitTextToSize(qText, textW - 40);
    doc.text(qLines, pageW / 2, y, { align: 'center' });
    y += qLines.length * 20 + 8;
  }

  y += 6;
  goldRule(doc, margin + 40, y, pageW - margin - 40, 0.3);
  y += 18;

  // ── Card image gallery on cover ──────────────────────────────────────────────
  const cardCount = reading.cards.length;
  const isCeltic  = cardCount >= 10;

  if (isCeltic) {
    // Celtic Cross: two rows of 5
    const cw  = 74;
    const ch  = cw * 1.5;
    const gap = (textW - 5 * cw) / 4;

    for (let row = 0; row < 2; row++) {
      const rowStart = row * 5;
      const rowEnd   = Math.min(rowStart + 5, cardCount);
      const rowCount = rowEnd - rowStart;
      const rowW     = rowCount * cw + (rowCount - 1) * gap;
      let   cx       = (pageW - rowW) / 2;

      for (let i = rowStart; i < rowEnd; i++) {
        const img = cardImages[i];
        if (img) {
          doc.addImage(img, 'JPEG', cx, y, cw, ch);
        } else {
          doc.setFillColor(...PARCHMENT);
          doc.roundedRect(cx, y, cw, ch, 2, 2, 'F');
          doc.setFontSize(6); doc.setFont('times', 'normal'); doc.setTextColor(...MID_BROWN);
          const nl = doc.splitTextToSize(sanitize(reading.cards[i].card.name), cw - 8);
          doc.text(nl, cx + cw / 2, y + ch / 2, { align: 'center' });
        }
        doc.setDrawColor(...GOLD); doc.setLineWidth(0.35);
        doc.roundedRect(cx, y, cw, ch, 2, 2, 'S');

        doc.setFont('times', 'italic'); doc.setFontSize(6); doc.setTextColor(...MID_BROWN);
        const posLabel = sanitize(reading.cards[i].position + (reading.cards[i].reversed ? ' (Rev.)' : ''));
        doc.text(posLabel, cx + cw / 2, y + ch + 9, { align: 'center' });
        cx += cw + gap;
      }
      y += ch + 20;
    }
  } else {
    // 1-5 cards: single centred row
    const maxCw = cardCount === 1 ? 170 : cardCount <= 3 ? 128 : 92;
    const cw    = Math.min(maxCw, (textW - (cardCount - 1) * 14) / cardCount);
    const ch    = cw * 1.575;
    const totalW = cardCount * cw + (cardCount - 1) * 14;
    let   cx     = (pageW - totalW) / 2;

    for (let i = 0; i < cardCount; i++) {
      const img = cardImages[i];
      if (img) {
        doc.addImage(img, 'JPEG', cx, y, cw, ch);
      } else {
        doc.setFillColor(...PARCHMENT);
        doc.roundedRect(cx, y, cw, ch, 3, 3, 'F');
        doc.setFontSize(7.5); doc.setFont('times', 'normal'); doc.setTextColor(...MID_BROWN);
        const nl = doc.splitTextToSize(sanitize(reading.cards[i].card.name), cw - 10);
        doc.text(nl, cx + cw / 2, y + ch / 2, { align: 'center' });
      }
      // Gold frame
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
      doc.roundedRect(cx, y, cw, ch, 3, 3, 'S');

      // Card name + position below image
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...DARK_BROWN);
      doc.text(sanitize(reading.cards[i].card.name), cx + cw / 2, y + ch + 11, { align: 'center' });

      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(...MID_BROWN);
      const posLabel = sanitize(reading.cards[i].position + (reading.cards[i].reversed ? '  Rev.' : ''));
      doc.text(posLabel, cx + cw / 2, y + ch + 20, { align: 'center' });

      cx += cw + 14;
    }
    y += ch + 32;
  }

  goldRule(doc, margin + 20, y, pageW - margin - 20, 0.3);
  y += 16;

  // Overall energy
  sectionLabel(doc, 'THE ENERGY OF THIS READING', pageW / 2, y);
  y += 14;

  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...DARK_BROWN);
  const oeLines = doc.splitTextToSize(sanitize(reading.overallEnergy), textW - 20);
  y = checkBreak(doc, y, oeLines.length * 15 + 10, pageW, pageH, margin);
  doc.text(oeLines, pageW / 2, y, { align: 'center' });
  y += oeLines.length * 15 + 20;

  // ── Per-card readings ────────────────────────────────────────────────────────
  const roman      = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
  const thumbW     = 96;
  const thumbH     = thumbW * 1.575;
  const textCol    = margin + thumbW + 16;
  const textColW   = pageW - margin - thumbW - 16 - margin;

  for (let i = 0; i < reading.cardReadings.length; i++) {
    const cr           = reading.cardReadings[i];
    const sectionNeeded = thumbH + 24;
    y = checkBreak(doc, y, sectionNeeded, pageW, pageH, margin);

    const sectionTop = y;

    // Top rule for this card
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.3);
    doc.line(margin - 6, y - 4, margin + textW + 6, y - 4);

    // Thumbnail
    const img = cardImages[i];
    if (img) {
      doc.addImage(img, 'JPEG', margin, y, thumbW, thumbH);
    } else {
      doc.setFillColor(...PARCHMENT_DARK);
      doc.roundedRect(margin, y, thumbW, thumbH, 2, 2, 'F');
      doc.setFont('times', 'normal'); doc.setFontSize(7); doc.setTextColor(...MID_BROWN);
      const nl = doc.splitTextToSize(sanitize(cr.card), thumbW - 8);
      doc.text(nl, margin + thumbW / 2, y + thumbH / 2, { align: 'center' });
    }
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, thumbW, thumbH, 2, 2, 'S');

    // Right column header
    let ry = y + 2;

    // Roman numeral
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...GOLD);
    doc.text(roman[i] ?? `${i + 1}`, textCol, ry);

    // Card name (+ reversed indicator)
    const cardLabel = sanitize(cr.card + (reading.cards[i]?.reversed ? '  -  Reversed' : ''));
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...DARK_BROWN);
    doc.text(cardLabel, textCol + 14, ry);
    ry += 16;

    // Position
    doc.setFont('times', 'italic'); doc.setFontSize(9.5); doc.setTextColor(...MID_BROWN);
    doc.text(sanitize(cr.position), textCol, ry);
    ry += 14;

    // Keywords
    if (cr.keywords?.length) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GOLD);
      doc.text(sanitize(cr.keywords.join('  -  ')), textCol, ry);
      ry += 13;
    }

    ry += 2;
    // Thin rule before body text
    doc.setDrawColor(200, 185, 165); doc.setLineWidth(0.25);
    doc.line(textCol, ry, pageW - margin, ry);
    ry += 9;

    // Interpretation text -- wraps in right column, then expands full-width below thumbnail
    doc.setFont('times', 'normal'); doc.setFontSize(10); doc.setTextColor(...DARK_BROWN);
    const interpLines = doc.splitTextToSize(sanitize(cr.interpretation), textColW);

    for (const line of interpLines) {
      const lineX = ry < sectionTop + thumbH + 8 ? textCol : margin;

      const newY = checkBreak(doc, ry, 13, pageW, pageH, margin);
      if (newY !== ry) {
        ry = newY;
      }

      doc.setFont('times', 'normal'); doc.setFontSize(10); doc.setTextColor(...DARK_BROWN);
      doc.text(line, lineX, ry);
      ry += 14;
    }

    y = Math.max(ry, sectionTop + thumbH + 8);
    y += 14;

    // Divider between cards
    if (i < reading.cardReadings.length - 1) {
      y = checkBreak(doc, y, 12, pageW, pageH, margin);
      doc.setDrawColor(214, 200, 178); doc.setLineWidth(0.25);
      doc.line(margin + 20, y, pageW - margin - 20, y);
      y += 14;
    }
  }

  // ── Synthesis ────────────────────────────────────────────────────────────────
  y = checkBreak(doc, y, 160, pageW, pageH, margin);
  y += 8;
  goldRule(doc, margin, y, pageW - margin, 0.5);
  y += 20;

  sectionLabel(doc, 'WHAT THE CARDS SAY TOGETHER', pageW / 2, y);
  y += 16;

  doc.setFont('times', 'italic'); doc.setFontSize(11.5); doc.setTextColor(...DARK_BROWN);
  const synLines = doc.splitTextToSize(sanitize(reading.synthesis), textW - 20);
  for (const line of synLines) {
    y = checkBreak(doc, y, 16, pageW, pageH, margin);
    doc.text(line, pageW / 2, y, { align: 'center' });
    y += 16;
  }
  y += 12;

  // ── Affirmation ──────────────────────────────────────────────────────────────
  y = checkBreak(doc, y, 60, pageW, pageH, margin);

  const affText  = sanitize(`"${reading.affirmation}"`);
  doc.setFont('times', 'italic'); doc.setFontSize(13.5); doc.setTextColor(...GOLD);
  const affLines = doc.splitTextToSize(affText, textW - 60);
  const affH     = affLines.length * 19 + 20;

  doc.setFillColor(...PARCHMENT);
  doc.roundedRect(margin + 10, y - 8, textW - 20, affH, 4, 4, 'F');
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.35);
  doc.roundedRect(margin + 10, y - 8, textW - 20, affH, 4, 4, 'S');
  doc.text(affLines, pageW / 2, y + 6, { align: 'center' });
  y += affH + 8;

  // ── Notable timing ───────────────────────────────────────────────────────────
  if (reading.notableTiming) {
    y = checkBreak(doc, y, 36, pageW, pageH, margin);
    y += 4;
    doc.setFont('times', 'italic'); doc.setFontSize(9); doc.setTextColor(...MID_BROWN);
    const timingLines = doc.splitTextToSize(sanitize(reading.notableTiming), textW - 40);
    doc.text(timingLines, pageW / 2, y, { align: 'center' });
    y += timingLines.length * 13 + 8;
  }

  // ── Footers on every page ────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...GOLD);
    doc.text('TAROT  AI', pageW / 2, pageH - 24, { align: 'center' });
    if (pageCount > 1) {
      doc.setFontSize(6.5); doc.setTextColor(...MID_BROWN);
      doc.text(`${p} of ${pageCount}`, pageW - margin + 4, pageH - 24, { align: 'right' });
    }
  }

  const filename = sanitize(
    `Tarot Reading ${new Date(reading.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.pdf`,
  ).replace(/\s+/g, ' ');
  doc.save(filename || 'tarot-reading.pdf');
}

// ── Print-and-cut cards PDF ───────────────────────────────────────────────────
/** Standard tarot size: 2.75" x 4.75" per card, 3-up across a letter sheet. */
export async function downloadCardsPDF(reading: ReadingResult): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const cardImages = await Promise.all(
    reading.cards.map(c => c.imageUrl ? imageToBase64(c.imageUrl) : Promise.resolve(null)),
  );

  const doc    = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageW  = 612;
  const pageH  = 792;
  const margin = 36;

  const cardW  = 198;  // 2.75" @ 72 pt/in
  const cardH  = 342;  // 4.75" @ 72 pt/in
  const cols   = 3;
  const labelH = 24;
  const gutterX = (pageW - margin * 2 - cols * cardW) / (cols - 1);
  const gutterY = 18;

  function initPage() {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, pageW, pageH, 'F');
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.7);
    doc.rect(8, 8, pageW - 16, pageH - 16, 'S');
    doc.setLineWidth(0.25);
    doc.rect(12, 12, pageW - 24, pageH - 24, 'S');
  }

  initPage();

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...GOLD);
  doc.text('TAROT  AI  -  PRINT & CUT', pageW / 2, 26, { align: 'center', charSpace: 1.5 });
  doc.setFontSize(6.5); doc.setTextColor(...MID_BROWN);
  doc.text('Standard tarot size - 2.75" x 4.75" - Cut along gold borders', pageW / 2, 35, { align: 'center' });

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
      const nl = doc.splitTextToSize(sanitize(reading.cards[i].card.name), cardW - 20);
      doc.text(nl, x + cardW / 2, y + cardH / 2, { align: 'center' });
    }

    doc.setDrawColor(...GOLD); doc.setLineWidth(0.5);
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'S');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DARK_BROWN);
    doc.text(sanitize(reading.cards[i].card.name), x + cardW / 2, y + cardH + 12, { align: 'center' });

    doc.setFont('times', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...MID_BROWN);
    const posLabel = sanitize(reading.cards[i].position + (reading.cards[i].reversed ? '  -  Reversed' : ''));
    doc.text(posLabel, x + cardW / 2, y + cardH + 22, { align: 'center' });

    col++;
    if (col >= cols) { col = 0; row++; }
  }

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...GOLD);
    doc.text('TAROT  AI', pageW / 2, pageH - 22, { align: 'center' });
    if (pageCount > 1) {
      doc.setFontSize(6.5); doc.setTextColor(...MID_BROWN);
      doc.text(`${p} of ${pageCount}`, pageW - margin, pageH - 22, { align: 'right' });
    }
  }

  const filename = sanitize(
    `Tarot Cards ${new Date(reading.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.pdf`,
  ).replace(/\s+/g, ' ');
  doc.save(filename || 'tarot-cards.pdf');
}
