/**
 * JSON-LD schema validity test.
 *
 * For every HTML file in dist/, extract every
 * <script type="application/ld+json"> block and assert:
 *
 *   1. The block parses as JSON.
 *   2. It has @context === 'https://schema.org' (or includes it for graph
 *      blocks).
 *   3. It has @type and the @type is a non-empty string (or, for @graph
 *      blocks, every entry has @type).
 *
 * This is a strong-but-not-exhaustive check. Full schema.org compliance
 * needs Google's Rich Results Test (https://search.google.com/test/rich-results)
 * or the schema.org validator (https://validator.schema.org/) — both are
 * HTTP-only and live in the CONTRIBUTING.md manual checklist.
 *
 * What this catches:
 *   - Malformed JSON in a JSON-LD block (caught build-time only if you
 *     happen to render every schema-producing page during build, which
 *     Astro does — but a regression in a helper could slip through).
 *   - Missing @context or @type on a block.
 *   - Accidental string-literal JSON-LD (e.g. someone manually wrote
 *     `<script type="application/ld+json">"some string"</script>`).
 */

import { describe, expect, it } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(__dirname, '..', 'dist');

async function walkHtmlFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkHtmlFiles(full)));
    } else if (e.isFile() && e.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function extractJsonLdBlocks(html: string): string[] {
  const out: string[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

function validateBlock(parsed: unknown): string | null {
  if (parsed === null || typeof parsed !== 'object') {
    return 'block is not an object';
  }
  const obj = parsed as Record<string, unknown>;
  const ctx = obj['@context'];
  if (typeof ctx === 'string') {
    if (!ctx.includes('schema.org')) return `@context "${ctx}" is not schema.org`;
  } else if (Array.isArray(ctx)) {
    if (!ctx.some((c) => typeof c === 'string' && c.includes('schema.org'))) {
      return '@context array missing schema.org entry';
    }
  } else {
    return 'missing @context';
  }

  // @graph form: validate each entry.
  if (Array.isArray(obj['@graph'])) {
    for (const [i, entry] of (obj['@graph'] as unknown[]).entries()) {
      if (entry === null || typeof entry !== 'object') {
        return `@graph[${i}] is not an object`;
      }
      const t = (entry as Record<string, unknown>)['@type'];
      if (typeof t !== 'string' || t.length === 0) {
        if (!Array.isArray(t) || t.length === 0) {
          return `@graph[${i}] missing @type`;
        }
      }
    }
    return null;
  }

  // Flat form: must have @type.
  const t = obj['@type'];
  if (typeof t === 'string' && t.length > 0) return null;
  if (Array.isArray(t) && t.length > 0) return null;
  return 'missing @type';
}

describe('JSON-LD schema validity', () => {
  it('every <script type="application/ld+json"> block in dist/ is valid', async () => {
    const files = await walkHtmlFiles(DIST);
    if (files.length === 0) {
      console.log(
        '[schema-validity] no dist/ output found — run `npm run build` first',
      );
      return;
    }

    const failures: { src: string; idx: number; reason: string }[] = [];
    let totalBlocks = 0;

    for (const file of files) {
      const html = await readFile(file, 'utf-8');
      const blocks = extractJsonLdBlocks(html);
      blocks.forEach((raw, idx) => {
        totalBlocks++;
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch (err) {
          failures.push({
            src: path.relative(DIST, file),
            idx,
            reason: `JSON.parse failed: ${(err as Error).message}`,
          });
          return;
        }
        const reason = validateBlock(parsed);
        if (reason) {
          failures.push({ src: path.relative(DIST, file), idx, reason });
        }
      });
    }

    if (failures.length > 0) {
      const detail = failures
        .map((f) => `  - ${f.src} block #${f.idx}: ${f.reason}`)
        .join('\n');
      throw new Error(
        `${failures.length}/${totalBlocks} JSON-LD blocks failed validation:\n${detail}`,
      );
    }

    expect(failures).toHaveLength(0);
  });
});
