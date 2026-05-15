/**
 * OG image SVG template — 1200×630.
 *
 * Renders an Open Graph card using design-system tokens directly (no font
 * loading; relies on widely available serif/sans-serif fallbacks since
 * embedding a variable-axis WOFF2 inside an SVG that Sharp rasterizes is
 * fragile and adds 200KB+ per build). The visual hierarchy (wordmark,
 * headline, kicker, byline) is preserved even with system fonts because
 * the design system's character is more about layout/color than the
 * specific letterforms — and OG cards display at thumbnail sizes anyway.
 *
 * If we later want exact Fraunces rendering, swap Sharp for @resvg/resvg-js
 * (which handles font embedding more cleanly) — but that's a 5MB binary
 * dep we don't need yet.
 *
 * Color tokens mirror src/styles/global.css `--color-*` light-mode values.
 */

import sharp from 'sharp';

interface OgOptions {
  /** Piece headline. Wraps automatically. */
  title: string;
  /** Optional small label above the title (e.g. "Brunch · Bellingham"). */
  kicker?: string;
  /** Optional byline/visit-date footer (e.g. "Visited Apr–May 2026"). */
  byline?: string;
}

const W = 1200;
const H = 630;
const COLOR_BG = '#FAF7F0';
const COLOR_BG_ELEVATED = '#F2EFE8';
const COLOR_TEXT = '#14131A';
const COLOR_MUTED = '#5E5C66';
const COLOR_ACCENT = '#2E4A5F';
const COLOR_BORDER = '#E5E1D8';

/** XML-escape user-supplied strings so they're safe inside <text> nodes. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wrap a title to fit within ~32 characters per line (works well at 56px
 * serif on a 1200px canvas with side padding). Returns up to 3 lines;
 * subsequent words are truncated with an ellipsis.
 */
function wrapTitle(title: string, maxCharsPerLine = 32, maxLines = 3): string[] {
  const words = title.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    const last = lines[lines.length - 1] ?? '';
    lines[lines.length - 1] = last.replace(/\s+\S+$/, '') + '…';
  }
  return lines;
}

export function renderOgSvg(opts: OgOptions): string {
  const titleLines = wrapTitle(opts.title);
  const titleStartY = 280 - (titleLines.length - 1) * 36;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${COLOR_BG}" />

  <!-- Top hairline border (matches site header treatment) -->
  <rect x="0" y="0" width="${W}" height="4" fill="${COLOR_ACCENT}" />

  <!-- Inset elevated panel (echoes the card surfaces in the design system) -->
  <rect x="80" y="80" width="${W - 160}" height="${H - 160}" fill="${COLOR_BG_ELEVATED}" rx="2" />
  <rect x="80" y="80" width="${W - 160}" height="${H - 160}" fill="none" stroke="${COLOR_BORDER}" stroke-width="1" rx="2" />

  <!-- Wordmark (top-left of panel) -->
  <text x="120" y="160"
        font-family="'Georgia', 'Times New Roman', serif"
        font-size="36" font-weight="600"
        fill="${COLOR_TEXT}"
        letter-spacing="-0.01em">bhamranked</text>
  <text x="120" y="190"
        font-family="ui-monospace, 'Geist Mono', 'Menlo', monospace"
        font-size="13"
        fill="${COLOR_MUTED}"
        letter-spacing="0.18em">BELLINGHAM · WA</text>

  ${
    opts.kicker
      ? `
  <!-- Kicker -->
  <text x="120" y="${titleStartY - 64}"
        font-family="ui-monospace, 'Geist Mono', 'Menlo', monospace"
        font-size="14"
        fill="${COLOR_ACCENT}"
        letter-spacing="0.16em">${esc(opts.kicker.toUpperCase())}</text>`
      : ''
  }

  <!-- Title (serif, large) -->
  ${titleLines
    .map(
      (line, idx) =>
        `<text x="120" y="${titleStartY + idx * 72}"
              font-family="'Georgia', 'Times New Roman', serif"
              font-size="64" font-weight="500"
              fill="${COLOR_TEXT}"
              letter-spacing="-0.015em">${esc(line)}</text>`,
    )
    .join('\n  ')}

  <!-- Bottom hairline + footer row -->
  <line x1="120" y1="${H - 120}" x2="${W - 120}" y2="${H - 120}" stroke="${COLOR_BORDER}" stroke-width="1" />

  <text x="120" y="${H - 88}"
        font-family="ui-monospace, 'Geist Mono', 'Menlo', monospace"
        font-size="13"
        fill="${COLOR_MUTED}"
        letter-spacing="0.12em">NO PAID PLACEMENT  ·  FIRST-PERSON REVIEWS</text>

  ${
    opts.byline
      ? `
  <text x="${W - 120}" y="${H - 88}"
        text-anchor="end"
        font-family="ui-monospace, 'Geist Mono', 'Menlo', monospace"
        font-size="13"
        fill="${COLOR_MUTED}"
        letter-spacing="0.12em">${esc(opts.byline.toUpperCase())}</text>`
      : ''
  }
</svg>`;
}

/** Rasterize SVG to PNG buffer via Sharp. */
export async function renderOgPng(opts: OgOptions): Promise<Buffer> {
  const svg = renderOgSvg(opts);
  return sharp(Buffer.from(svg)).png().toBuffer();
}
