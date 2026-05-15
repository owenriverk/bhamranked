/**
 * Internal link integrity test.
 *
 * Runs after `npm run build` produces `dist/`. Crawls every HTML file in
 * `dist/`, collects every internal href, and asserts each one resolves
 * to a real file (or a redirect target also in dist/, or a static asset).
 *
 * External links are not checked here — they belong in a periodic offline
 * sweep, not on every PR. Internal-link regressions are what tank SEO
 * silently, so that's what we gate the build on.
 *
 * Why not `linkinator` directly: linkinator wants to start its own HTTP
 * server and hits real DNS for any external. For static-only internal
 * checking we get faster, more predictable results by walking the file
 * tree ourselves.
 */

import { describe, expect, it } from 'vitest';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = path.resolve(__dirname, '..', 'dist');

const INTERNAL_HOSTS = new Set([
  'bhamranked.com',
  'www.bhamranked.com',
]);

const SKIP_PREFIXES = [
  'mailto:',
  'tel:',
  'sms:',
  'javascript:',
  'data:',
  '#',
];

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

function extractHrefs(html: string): string[] {
  const out: string[] = [];
  const re = /href="([^"#?]+)(?:[#?][^"]*)?"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (m[1]) out.push(m[1]);
  }
  return out;
}

function isInternal(href: string): boolean {
  for (const p of SKIP_PREFIXES) {
    if (href.startsWith(p)) return false;
  }
  if (href.startsWith('//')) return false;
  if (href.startsWith('http://') || href.startsWith('https://')) {
    try {
      const u = new URL(href);
      return INTERNAL_HOSTS.has(u.host);
    } catch {
      return false;
    }
  }
  return href.startsWith('/');
}

function normalizeToFsPath(href: string): string {
  // Strip query/hash, drop the protocol+host if present.
  let p = href;
  try {
    if (p.startsWith('http')) {
      const u = new URL(p);
      p = u.pathname;
    }
  } catch {
    /* fall through with original */
  }
  // Remove leading slash, query, hash.
  p = p.replace(/^\//, '').split('?')[0]!.split('#')[0]!;
  return p;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveInDist(href: string): Promise<boolean> {
  const rel = normalizeToFsPath(href);
  if (rel === '') return pathExists(path.join(DIST, 'index.html'));

  // Asset file (has an extension)? Look it up directly.
  if (/\.[a-zA-Z0-9]{1,8}$/.test(rel)) {
    return pathExists(path.join(DIST, rel));
  }

  // Astro emits trailingSlash:'never' → `/about` → dist/about/index.html
  // OR a literal dist/about.html. Check both.
  const candidates = [
    path.join(DIST, rel, 'index.html'),
    path.join(DIST, `${rel}.html`),
    path.join(DIST, rel), // dir-only check (rare but cheap)
  ];
  for (const c of candidates) {
    if (await pathExists(c)) return true;
  }
  return false;
}

describe('internal link integrity', () => {
  it('every internal href resolves to a real file in dist/', async () => {
    const files = await walkHtmlFiles(DIST);
    if (files.length === 0) {
      console.log(
        '[link-integrity] no dist/ output found — run `npm run build` first or skip this test in dev',
      );
      return;
    }

    const broken: { src: string; href: string }[] = [];

    for (const file of files) {
      const html = await readFile(file, 'utf-8');
      const hrefs = extractHrefs(html);
      for (const href of hrefs) {
        if (!isInternal(href)) continue;
        const ok = await resolveInDist(href);
        if (!ok) {
          broken.push({ src: path.relative(DIST, file), href });
        }
      }
    }

    if (broken.length > 0) {
      const detail = broken
        .map((b) => `  - ${b.src} → ${b.href}`)
        .join('\n');
      throw new Error(`${broken.length} broken internal link(s):\n${detail}`);
    }

    expect(broken).toHaveLength(0);
  });
});
