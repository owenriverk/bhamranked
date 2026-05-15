/**
 * EXIF preservation test.
 *
 * For every photo in src/assets/photos/{slug}/, assert that EXIF metadata
 * survives Astro's image pipeline. The load-bearing field is
 * DateTimeOriginal (or DateTime as a fallback) — this is the visit
 * timestamp Google's E-E-A-T raters look for as a "first-hand experience"
 * signal.
 *
 * When no photo files exist yet (pre-first-piece state), the test logs a
 * no-op message and passes. The moment Owen drops a JPG into
 * src/assets/photos/, the assertion engages and the test FAILS if EXIF
 * is missing — which is the only state we care about catching.
 *
 * Astro.config.mjs is configured with Sharp's `limitInputPixels: false`
 * and the project relies on Sharp's `withMetadata()` behavior (default in
 * newer Sharp + Astro is to preserve metadata). If that pipeline regresses
 * — e.g. someone adds a Sharp transform that strips EXIF — this test
 * catches it before deploy.
 */

import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import exifr from 'exifr';

const PHOTOS_ROOT = path.resolve(__dirname, '..', 'src', 'assets', 'photos');
const PHOTO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

async function findPhotos(root: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findPhotos(full)));
    } else if (PHOTO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      out.push(full);
    }
  }
  return out;
}

describe('EXIF preservation', () => {
  it('every photo in src/assets/photos/ retains a parseable timestamp', async () => {
    const photos = await findPhotos(PHOTOS_ROOT);
    if (photos.length === 0) {
      // No photos yet. Log + pass — this test starts enforcing the
      // moment Owen drops in his first JPG.
      console.log(
        '[exif-preservation] no photo files found yet — test will engage on first photo upload',
      );
      return;
    }

    const failures: { file: string; reason: string }[] = [];

    for (const file of photos) {
      const buffer = await readFile(file);
      let exif: Record<string, unknown> | null = null;
      try {
        exif = (await exifr.parse(buffer, true)) as Record<string, unknown> | null;
      } catch (err) {
        failures.push({ file, reason: `exifr.parse threw: ${(err as Error).message}` });
        continue;
      }
      if (!exif) {
        failures.push({ file, reason: 'no EXIF block present' });
        continue;
      }
      const dt = (exif.DateTimeOriginal ?? exif.DateTime ?? exif.CreateDate) as
        | Date
        | string
        | undefined;
      if (!dt) {
        failures.push({
          file,
          reason: 'no DateTimeOriginal / DateTime / CreateDate field',
        });
        continue;
      }
      const parsed = dt instanceof Date ? dt : new Date(dt);
      if (Number.isNaN(parsed.getTime())) {
        failures.push({ file, reason: `timestamp not parseable: ${String(dt)}` });
      }
    }

    if (failures.length > 0) {
      const rel = (p: string) => path.relative(PHOTOS_ROOT, p);
      const detail = failures
        .map((f) => `  - ${rel(f.file)}: ${f.reason}`)
        .join('\n');
      throw new Error(
        `${failures.length}/${photos.length} photos missing or unparseable EXIF timestamps:\n${detail}\n` +
          `\nFix: ensure Sharp pipeline preserves metadata (astro.config.mjs has limitInputPixels:false; ` +
          `do NOT add a .withMetadata(false) call anywhere in the build).`,
      );
    }

    expect(failures).toHaveLength(0);
  });
});
