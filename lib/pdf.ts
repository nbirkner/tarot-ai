import { ReadingResult } from './types';

// ── Palette ───────────────────────────────────────────────────────────────────
const GOLD: [number, number, number]       = [180, 130, 40];
const DARK: [number, number, number]       = [30, 20, 10];
const GRAY: [number, number, number]       = [100, 85, 70];
const LIGHT_GRAY: [number, number, number] = [200, 190, 180];

// ── Font loader ───────────────────────────────────────────────────────────────
// Fetches TTF from /public/fonts/, converts to base64, registers with jsPDF.
async function arrayBufToBase64(buf: ArrayBuffer): Promise<string> {
  return new Promise((resolve) => {
    const blob = new Blob([buf]);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

type jsPDFType = import('jspdf').jsPDF;

async function loadFonts(doc: jsPDFType): Promise<void> {
  const fonts = [
    { path: '/fonts/Cinzel-Regular.ttf',    name: 'Cinzel',   style: 'normal' },
    { path: '/fonts/Cinzel-Bold.ttf',       name: 'Cinzel',   style: 'bold'   },
    { path: '/fonts/Spectral-Regular.ttf',  name: 'Spectral', style: 'normal' },
    { path: '/fonts/Spectral-Italic.ttf',   name: 'Spectral', style: 'italic' },
  ] as const;

  await Promise.all(
    fonts.map(async ({ path, name, style }) => {
      try {
        const res = await fetch(path);
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        const b64 = await arrayBufToBase64(buf);
        const filename = path.split('/').pop()!;
        doc.addFileToVFS(filename, b64);
        doc.addFont(filename, name, style);
      } catch {
        // font load failed — fall back to built-in helvetica/times
      }
    }),
  );
}

// ── Unicode sanitizer ─────────────────────────────────────────────────────────
// jsPDF built-in fonts only support Latin-1. Strip everything else.
function sanitize(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2022\u00B7\u2027]/g, '-')
    .replace(/[\u2605\u2606\u2728\u2734\u2736\u2726\u2739]/g, '*')
    .replace(/[^\u0000-\u00FF]/g, '')
    .trim();
}

// ── Server-side image proxy ───────────────────────────────────────────────────
// Fetches image via /api/proxy-image (runs on the server, no CORS),
// then converts to JPEG via canvas so jsPDF can embed it.
async function fetchImageAsJpeg(imageUrl: string): Promise<string | null> {
  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      console.warn('proxy-image failed:', res.status, imageUrl);
      return null;
    }
    const blob = await res.blob();

    return await new Promise<string | null>((resolve) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();

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
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } catch (e) {
          console.warn('canvas toDataURL failed:', e);
          resolve(null);
        }
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        console.warn('img.onerror:', e);
        resolve(null);
      };

      img.src = objectUrl;
    });
  } catch (e) {
    console.warn('fetchImageAsJpeg error:', e);
    return null;
  }
}

// ── Pooled image loader (max N concurrent) ────────────────────────────────────
async function fetchImagesPooled(
  cards: ReadingResult['cards'],
  concurrency = 3,
): Promise<(string | null)[]> {
  const results: (string | null)[] = new Array(cards.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < cards.length) {
      const i = next++;
      const url = cards[i].imageUrl;
      // Skip missing or explicitly-failed URLs
      if (!url || url === 'failed') { results[i] = null; continue; }
      results[i] = await fetchImageAsJpeg(url);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, cards.length) }, worker));
  return results;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function downloadReadingPDF(reading: ReadingResult): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });

  // Fonts and images in parallel, but images themselves max 3 concurrent
  const [cardImages] = await Promise.all([
    fetchImagesPooled(reading.cards, 3),
    loadFonts(doc),
  ]);

  const pageW  = 612;
  const pageH  = 792;
  const M      = 48;   // margin
  const col    = M;
  const maxW   = pageW - M * 2;

  // helpers
  const newPage = () => { doc.addPage(); return M; };
  const needsBreak = (y: number, h: number) => y + h > pageH - M;
  const maybeBreak = (y: number, h: number) => needsBreak(y, h) ? newPage() : y;

  // ── Header ─────────────────────────────────────────────────────────────────
  let y = M;

  doc.setFont('Cinzel', 'normal');
  doc.setFontSize(20);
  doc.setTextColor(...DARK);
  doc.text('Tarot Reading', col, y);
  y += 22;

  const dateStr = sanitize(
    new Date(reading.date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }),
  );
  doc.setFont('Spectral', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(dateStr, col, y);
  y += 18;

  if (reading.question) {
    doc.setFont('Spectral', 'italic');
    doc.setFontSize(13);
    doc.setTextColor(...DARK);
    const qLines = doc.splitTextToSize(sanitize(`"${reading.question}"`), maxW);
    doc.text(qLines, col, y);
    y += qLines.length * 17 + 6;
  }

  // Gold rule under header
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(col, y, col + maxW, y);
  y += 20;

  // ── Cards ──────────────────────────────────────────────────────────────────
  const imgW  = 108;  // card image width in points (~1.5")
  const imgH  = imgW * 1.575;
  const textX = col + imgW + 16;
  const textW = maxW - imgW - 16;

  for (let i = 0; i < reading.cardReadings.length; i++) {
    const cr  = reading.cardReadings[i];
    const dc  = reading.cards[i];
    const img = cardImages[i];

    // Each card needs at least the image height + some padding
    const cardBlockMin = imgH + 24;
    y = maybeBreak(y, cardBlockMin);
    const blockTop = y;

    // Card image (or placeholder)
    if (img) {
      doc.addImage(img, 'JPEG', col, y, imgW, imgH);
    } else {
      doc.setFillColor(240, 235, 225);
      doc.roundedRect(col, y, imgW, imgH, 3, 3, 'F');
      doc.setFont('Spectral', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      const nameLines = doc.splitTextToSize(sanitize(cr.card), imgW - 8);
      doc.text(nameLines, col + imgW / 2, y + imgH / 2, { align: 'center' });
    }
    // Gold border around image
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.roundedRect(col, y, imgW, imgH, 3, 3, 'S');

    // Right column: card name
    let ry = y + 2;
    doc.setFont('Cinzel', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    const nameLabel = sanitize(cr.card + (dc?.reversed ? '  (Reversed)' : ''));
    const nameLines2 = doc.splitTextToSize(nameLabel, textW);
    doc.text(nameLines2, textX, ry);
    ry += nameLines2.length * 16 + 2;

    // Position
    doc.setFont('Spectral', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(sanitize(cr.position), textX, ry);
    ry += 14;

    // Keywords
    if (cr.keywords?.length) {
      doc.setFont('Cinzel', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GOLD);
      doc.text(sanitize(cr.keywords.join('  -  ')), textX, ry);
      ry += 14;
    }

    // Thin rule
    ry += 2;
    doc.setDrawColor(...LIGHT_GRAY);
    doc.setLineWidth(0.25);
    doc.line(textX, ry, textX + textW, ry);
    ry += 10;

    // Interpretation — flows in right column while image is there, then full width
    doc.setFont('Spectral', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    const interp = doc.splitTextToSize(sanitize(cr.interpretation), textW);

    for (const line of interp) {
      // Once we're past the image bottom, switch to full width
      const isBelow = ry > blockTop + imgH + 4;
      const lineX   = isBelow ? col : textX;
      ry = maybeBreak(ry, 14);
      doc.setFont('Spectral', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(...DARK);
      doc.text(line, lineX, ry);
      ry += 14;
    }

    y = Math.max(ry, blockTop + imgH + 6);
    y += 10;

    // Divider between cards
    if (i < reading.cardReadings.length - 1) {
      y = maybeBreak(y, 10);
      doc.setDrawColor(...LIGHT_GRAY);
      doc.setLineWidth(0.3);
      doc.line(col + 20, y, col + maxW - 20, y);
      y += 18;
    }
  }

  // ── Synthesis ─────────────────────────────────────────────────────────────
  y = maybeBreak(y, 80);
  y += 12;

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(col, y, col + maxW, y);
  y += 18;

  doc.setFont('Cinzel', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...DARK);
  doc.text('The Reading as a Whole', col, y);
  y += 18;

  if (reading.overallEnergy) {
    doc.setFont('Spectral', 'italic');
    doc.setFontSize(11.5);
    doc.setTextColor(...DARK);
    const oeLines = doc.splitTextToSize(sanitize(reading.overallEnergy), maxW);
    y = maybeBreak(y, oeLines.length * 16 + 8);
    doc.text(oeLines, col, y);
    y += oeLines.length * 16 + 10;
  }

  if (reading.synthesis) {
    doc.setFont('Spectral', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...DARK);
    const synLines = doc.splitTextToSize(sanitize(reading.synthesis), maxW);
    y = maybeBreak(y, synLines.length * 14 + 8);
    doc.text(synLines, col, y);
    y += synLines.length * 14 + 14;
  }

  if (reading.affirmation) {
    y = maybeBreak(y, 50);
    const affText  = sanitize(`"${reading.affirmation}"`);
    const affLines = doc.splitTextToSize(affText, maxW - 40);
    const affH     = affLines.length * 19 + 20;
    doc.setFillColor(248, 243, 232);
    doc.roundedRect(col + 10, y - 6, maxW - 20, affH, 4, 4, 'F');
    doc.setFont('Spectral', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(...GOLD);
    doc.text(affLines, col + 30, y + 6);
    y += affH + 10;
  }

  if (reading.notableTiming) {
    y = maybeBreak(y, 30);
    doc.setFont('Spectral', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    const tLines = doc.splitTextToSize(sanitize(reading.notableTiming), maxW);
    doc.text(tLines, col, y);
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont('Cinzel', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...LIGHT_GRAY);
    doc.text('Tarot AI', col, pageH - 24);
    if (total > 1) {
      doc.text(`${p} / ${total}`, pageW - M, pageH - 24, { align: 'right' });
    }
  }

  const filename = sanitize(
    `Tarot Reading ${new Date(reading.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })}.pdf`,
  ).replace(/\s+/g, ' ');

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'tarot-reading.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// ── Print-and-cut cards PDF ───────────────────────────────────────────────────
export async function downloadCardsPDF(reading: ReadingResult): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc   = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const [cardImages] = await Promise.all([
    fetchImagesPooled(reading.cards, 3),
    loadFonts(doc),
  ]);

  const pageW = 612;
  const pageH = 792;
  const M     = 36;
  const cardW = 198;
  const cardH = 342;
  const cols  = 3;
  const gutX  = (pageW - M * 2 - cols * cardW) / (cols - 1);
  const gutY  = 18;
  const labelH = 24;

  let col = 0;
  let row = 0;

  const pageTop = () => {
    doc.setFillColor(253, 250, 246);
    doc.rect(0, 0, pageW, pageH, 'F');
  };
  pageTop();

  for (let i = 0; i < reading.cards.length; i++) {
    if (i > 0 && col === 0) {
      doc.addPage();
      pageTop();
    }

    const x = M + col * (cardW + gutX);
    const y = M + row * (cardH + labelH + gutY);

    const img = cardImages[i];
    if (img) {
      doc.addImage(img, 'JPEG', x, y, cardW, cardH);
    } else {
      doc.setFillColor(240, 235, 225);
      doc.rect(x, y, cardW, cardH, 'F');
      doc.setFont('Spectral', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(120, 100, 80);
      const nl = doc.splitTextToSize(sanitize(reading.cards[i].card.name), cardW - 10);
      doc.text(nl, x + cardW / 2, y + cardH / 2, { align: 'center' });
    }

    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.5);
    doc.rect(x, y, cardW, cardH, 'S');

    doc.setFont('Cinzel', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(sanitize(reading.cards[i].card.name), x + cardW / 2, y + cardH + 13, { align: 'center' });
    doc.setFont('Spectral', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    const posLabel = sanitize(reading.cards[i].position + (reading.cards[i].reversed ? ' (Rev.)' : ''));
    doc.text(posLabel, x + cardW / 2, y + cardH + 22, { align: 'center' });

    col++;
    if (col >= cols) { col = 0; row++; }
  }

  const filename = sanitize(
    `Tarot Cards ${new Date(reading.date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })}.pdf`,
  ).replace(/\s+/g, ' ');

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'tarot-cards.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
