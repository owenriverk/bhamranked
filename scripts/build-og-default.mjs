#!/usr/bin/env node
/**
 * Generate public/og-default.png — the fallback Open Graph image used by
 * trust pages, the homepage, and any page that doesn't supply its own.
 *
 * Re-run on demand:
 *   node scripts/build-og-default.mjs
 *
 * This is a one-off generator, not part of the regular `npm run build`,
 * because the output is committed to git so static-hosting CDNs can serve
 * it before the dynamic /og/* routes have warmed any cache. Re-run only
 * when the design tokens or fallback copy change.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const W = 1200;
const H = 630;
const COLOR_BG = '#FAF7F0';
const COLOR_BG_ELEVATED = '#F2EFE8';
const COLOR_TEXT = '#14131A';
const COLOR_MUTED = '#5E5C66';
const COLOR_ACCENT = '#2E4A5F';
const COLOR_BORDER = '#E5E1D8';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${COLOR_BG}" />
  <rect x="0" y="0" width="${W}" height="4" fill="${COLOR_ACCENT}" />

  <rect x="80" y="80" width="${W - 160}" height="${H - 160}" fill="${COLOR_BG_ELEVATED}" rx="2" />
  <rect x="80" y="80" width="${W - 160}" height="${H - 160}" fill="none" stroke="${COLOR_BORDER}" stroke-width="1" rx="2" />

  <!-- Wordmark, centered -->
  <text x="${W / 2}" y="260"
        text-anchor="middle"
        font-family="'Georgia', 'Times New Roman', serif"
        font-size="92" font-weight="600"
        fill="${COLOR_TEXT}"
        letter-spacing="-0.02em">bhamranked</text>

  <text x="${W / 2}" y="305"
        text-anchor="middle"
        font-family="ui-monospace, 'Geist Mono', 'Menlo', monospace"
        font-size="16"
        fill="${COLOR_ACCENT}"
        letter-spacing="0.24em">BELLINGHAM · WASHINGTON</text>

  <!-- Tagline -->
  <text x="${W / 2}" y="400"
        text-anchor="middle"
        font-family="'Georgia', 'Times New Roman', serif"
        font-size="32" font-style="italic" font-weight="400"
        fill="${COLOR_TEXT}"
        letter-spacing="-0.005em">First-person reviews of Bellingham, WA businesses.</text>

  <line x1="180" y1="${H - 120}" x2="${W - 180}" y2="${H - 120}" stroke="${COLOR_BORDER}" stroke-width="1" />

  <text x="${W / 2}" y="${H - 88}"
        text-anchor="middle"
        font-family="ui-monospace, 'Geist Mono', 'Menlo', monospace"
        font-size="14"
        fill="${COLOR_MUTED}"
        letter-spacing="0.16em">NO PAID PLACEMENT  ·  NO COMPED MEALS  ·  NO SPONSORED CONTENT</text>
</svg>`;

const outputPath = path.join(projectRoot, 'public', 'og-default.png');
await mkdir(path.dirname(outputPath), { recursive: true });

const png = await sharp(Buffer.from(svg)).png().toBuffer();
await writeFile(outputPath, png);

console.log(`Wrote ${outputPath} (${png.length.toLocaleString()} bytes)`);
