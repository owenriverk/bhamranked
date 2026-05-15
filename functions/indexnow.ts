/**
 * IndexNow Cloudflare Pages Function.
 *
 * Submits new/changed URLs from sitemap-0.xml to the IndexNow API on every
 * deploy. IndexNow is a single endpoint that Bing, Yandex, Seznam, and
 * Yep all consume; Google reads sitemaps directly but doesn't accept
 * IndexNow yet (as of 2026-05). We submit anyway because the cost is zero
 * and Google may turn it on at any time.
 *
 * Pages Functions routing: this file is reachable at /indexnow on the
 * deployed site. Two ways to invoke:
 *
 *   1. Manual:   curl -X POST https://bhamranked.com/indexnow
 *   2. Webhook:  configure a Cloudflare Pages Deployment webhook (Pages
 *                dashboard → Settings → Builds → Deploy hooks) that POSTs
 *                here after every successful deploy.
 *
 * For maximum simplicity, the worker re-submits ALL URLs from the sitemap
 * on every run. IndexNow tolerates duplicates and rate-limits gracefully.
 * If submission volume becomes a concern, switch to the diff strategy:
 *   - store last-submitted manifest in KV (binding LAST_PUBLISHED)
 *   - compare current sitemap to manifest, submit only the delta
 *
 * The KV binding `LAST_PUBLISHED` is declared in wrangler.toml so the
 * worker can be upgraded to diff mode without re-deploying the codebase
 * — flip the `USE_DIFF` flag below.
 *
 * Owen-side setup (one-time):
 *   1. Generate a 32-character hex IndexNow API key (the IndexNow spec
 *      accepts any 8-128 char string of [a-zA-Z0-9-]; UUIDv4 minus
 *      hyphens works). Example:
 *        node -e "console.log(crypto.randomUUID().replace(/-/g, ''))"
 *   2. Create the key-file: `public/{KEY}.txt` containing only that key.
 *      IndexNow uses this to verify ownership.
 *   3. Set the env var INDEXNOW_KEY in Cloudflare Pages → Settings → Env
 *      Variables (Production scope). The worker reads it from `env`.
 *   4. Optional: create a KV namespace named bhamranked-last-published
 *      in Cloudflare → Workers → KV, bind it as LAST_PUBLISHED in
 *      Pages → Settings → Functions → KV bindings.
 *
 * Docs: https://www.indexnow.org/documentation
 */

interface Env {
  INDEXNOW_KEY?: string;
  /** Optional KV namespace for diff-mode submissions. */
  LAST_PUBLISHED?: KVNamespace;
  /** Optional override of the public host (default: derived from request). */
  PUBLIC_HOST?: string;
}

const USE_DIFF = false;
const MAX_URLS_PER_BATCH = 10_000; // IndexNow limit

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface PagesContext {
  request: Request;
  env: Env;
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request, env } = context;
  if (request.method !== 'POST' && request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!env.INDEXNOW_KEY) {
    return json(
      {
        ok: false,
        error:
          'INDEXNOW_KEY env var not set. Configure in Cloudflare Pages → Settings → Env Variables.',
      },
      500,
    );
  }

  const url = new URL(request.url);
  const host = env.PUBLIC_HOST ?? url.host;
  const origin = `${url.protocol}//${host}`;

  // 1. Fetch the sitemap and extract URLs.
  let sitemapUrls: string[];
  try {
    sitemapUrls = await fetchSitemapUrls(origin);
  } catch (err) {
    return json({ ok: false, error: `sitemap fetch failed: ${(err as Error).message}` }, 502);
  }

  // 2. Compute the URL list to submit.
  let urlsToSubmit = sitemapUrls;
  if (USE_DIFF && env.LAST_PUBLISHED) {
    const last = await env.LAST_PUBLISHED.get('urls');
    if (last) {
      const lastSet = new Set(last.split('\n'));
      urlsToSubmit = sitemapUrls.filter((u) => !lastSet.has(u));
    }
  }
  if (urlsToSubmit.length === 0) {
    return json({ ok: true, submitted: 0, note: 'no changed urls' });
  }

  // 3. Submit to IndexNow.
  const batch = urlsToSubmit.slice(0, MAX_URLS_PER_BATCH);
  const indexNowRes = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host,
      key: env.INDEXNOW_KEY,
      keyLocation: `${origin}/${env.INDEXNOW_KEY}.txt`,
      urlList: batch,
    }),
  });

  // 4. Update KV manifest (best-effort).
  if (USE_DIFF && env.LAST_PUBLISHED) {
    try {
      await env.LAST_PUBLISHED.put('urls', sitemapUrls.join('\n'));
    } catch (err) {
      // Non-fatal — manifest will retry next run.
      console.error('KV put failed', err);
    }
  }

  return json({
    ok: indexNowRes.ok,
    indexnow_status: indexNowRes.status,
    submitted: batch.length,
    total_in_sitemap: sitemapUrls.length,
  });
};

async function fetchSitemapUrls(origin: string): Promise<string[]> {
  // Astro emits /sitemap-index.xml plus N child sitemaps. Read the index
  // first, then fetch each child sitemap and extract <loc>.
  const indexRes = await fetch(`${origin}/sitemap-index.xml`);
  if (!indexRes.ok) throw new Error(`sitemap-index.xml returned ${indexRes.status}`);
  const indexXml = await indexRes.text();
  const childSitemaps = extractLocs(indexXml);

  const allUrls: string[] = [];
  for (const child of childSitemaps) {
    try {
      const res = await fetch(child);
      if (!res.ok) continue;
      const xml = await res.text();
      allUrls.push(...extractLocs(xml));
    } catch {
      // Skip unreachable child sitemap.
    }
  }
  return Array.from(new Set(allUrls));
}

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    if (m[1]) out.push(m[1].trim());
  }
  return out;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
