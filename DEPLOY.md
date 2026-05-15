# Deploy guide — bhamranked.com

Step-by-step actions for the first deploy. Items here are Owen-side (account
creation, domain registration, secret rotation) — the engineering scaffolding
already lives in the repo. Each step lists what to do, where to do it, and
what to paste back into the codebase afterward.

Estimated time: 60-90 minutes total, including DNS propagation waits.

---

## 1. Register the domain

If `bhamranked.com` is still available:
- Register it through Cloudflare Registrar (transfers free to CF DNS later)
  or Namecheap. Cloudflare Registrar is the simpler path because step 5 is
  one click.

If `bhamranked.com` is taken, decent alternatives in order of preference:

- `bhamranked.co`
- `bham-ranked.com`
- `ranked.bham.so`
- `bellinghamranked.com` (longer, but unambiguous)
- `bhamlist.com` / `bhamlocal.com` (rebrand cost — only if both above are taken)

Pick one and proceed. The site code references `https://bhamranked.com`
hard-coded in three places — search and replace if you pick a different
domain:

```bash
grep -rln "bhamranked.com" src/ public/ functions/ scripts/ tests/
```

## 2. Create the Cloudflare account (if you don't have one)

https://dash.cloudflare.com/sign-up — free plan. Verify the email.

## 3. Connect the GitHub repo to Cloudflare Pages

1. Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git.
2. Authorize the Cloudflare GitHub app on `owenriverk/bhamranked`.
3. Select the repo. Project name: `bhamranked`.
4. Build settings:
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: (leave blank)
   - Environment variables:
     - `NODE_VERSION` = `22`
5. Click "Save and Deploy". The first build will succeed and the site will be
   available at `bhamranked.pages.dev`.

## 4. Point DNS at Cloudflare

If you bought the domain at Cloudflare Registrar: skip — DNS is already managed.

If you bought elsewhere:

1. Cloudflare dashboard → Add a Site → enter your domain.
2. Cloudflare scans existing DNS; review the imported records (mostly safe
   to keep all).
3. Copy the two nameservers Cloudflare provides.
4. At your registrar, replace the nameservers with Cloudflare's. Propagation
   typically takes 5-30 minutes.

Once Cloudflare reports "Active" on the domain:

1. Pages project → Custom domains → Set up custom domain → enter the apex
   `bhamranked.com`. CF auto-provisions the cert.
2. Repeat for `www.bhamranked.com`. CF auto-creates a redirect from `www` to
   apex (or apex to `www` if you prefer — pick one and stick with it; the
   canonical URLs in `src/lib/schema.ts` assume apex without `www`).

## 5. Enable Cloudflare Web Analytics

1. Pages project → Analytics → Web Analytics → Enable.
2. CF generates a beacon token (a 32-char hex string).
3. Open `src/layouts/BaseLayout.astro`. Find the comment block that begins
   `<!-- Cloudflare Web Analytics`. Uncomment the `<script>` and replace
   `CF_BEACON_ID_REPLACE_AFTER_DEPLOY` with your beacon token.
4. Commit + push. Auto-deploy.

## 6. Generate IndexNow API key + create the verification file

1. Generate a 32-char hex key locally:

   ```bash
   node -e "console.log(crypto.randomUUID().replace(/-/g, ''))"
   ```

2. Create `public/{KEY}.txt` (filename = the key string; contents = the key
   string on a single line). Example: if key is `abc123…`, create
   `public/abc123…txt` containing `abc123…`.
3. Commit + push.
4. Pages project → Settings → Environment variables (Production scope) →
   add `INDEXNOW_KEY` = `{KEY}`.
5. Re-deploy (Pages → Deployments → Retry latest deployment) so the worker
   picks up the env var.

Verify by curl after deploy:

```bash
curl -X POST https://bhamranked.com/indexnow
# expect: {"ok": true, "submitted": N, ...}
```

## 7. Create the KV namespace (for IndexNow diff mode — optional)

The default IndexNow worker re-submits every sitemap URL on each invocation
(simple and effective at this scale). If submission volume becomes a
concern, switch to diff mode:

1. Cloudflare dashboard → Workers & Pages → KV → Create a namespace named
   `bhamranked-last-published`.
2. Pages project → Settings → Functions → KV namespace bindings → add
   `LAST_PUBLISHED` → select the namespace above.
3. Edit `functions/indexnow.ts`, set `USE_DIFF = true`.
4. Commit + push.

Until step 1-3, skip this — wrangler.toml has the binding declared
non-fatally; missing binding just means the worker stays in "submit all"
mode.

## 8. Submit verification meta tags to Search Console + Bing

1. https://search.google.com/search-console → Add property → URL prefix →
   `https://bhamranked.com`.
2. Select HTML tag verification → copy the `content="..."` value.
3. Edit `src/layouts/BaseLayout.astro`. Uncomment the
   `<meta name="google-site-verification" ...>` line and paste the token.
4. Commit + push. Wait for deploy.
5. Click "Verify" in Search Console.
6. Same flow for Bing Webmaster Tools at https://www.bing.com/webmasters →
   `msvalidate.01` meta tag.

After verification, submit the sitemap from each console:

- Search Console → Sitemaps → enter `sitemap-index.xml` → Submit
- Bing Webmaster → Sitemaps → enter `https://bhamranked.com/sitemap-index.xml`

## 9. Smoke test the live deploy

- [ ] `https://bhamranked.com/` returns 200 with the design-system styling
- [ ] `https://bhamranked.com/sitemap-index.xml` returns valid XML
- [ ] `https://bhamranked.com/feed.xml` returns valid RSS
- [ ] `https://bhamranked.com/robots.txt` returns 200
- [ ] `https://bhamranked.com/og-default.png` returns the 1200×630 PNG
- [ ] `https://bhamranked.com/indexnow` (POST) returns ok:true
- [ ] Validate the homepage in Google Rich Results Test: https://search.google.com/test/rich-results
- [ ] Validate OG preview in Twitter Card Validator: https://cards-dev.twitter.com/validator
- [ ] Validate OG preview in Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- [ ] Cloudflare Web Analytics shows the smoke-test traffic within 5 minutes

## 10. Optional: GitHub Actions explicit deploy

If you want CI to deploy in addition to CF's built-in Git integration
(useful for tighter control over PR preview routing):

1. Cloudflare → My Profile → API Tokens → Create Token → "Custom token":
   - Permissions: Account → Cloudflare Pages → Edit
   - Account resources: Include → your account
2. Copy the token.
3. GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
   - `CLOUDFLARE_API_TOKEN` = (the token)
   - `CLOUDFLARE_ACCOUNT_ID` = (find at Cloudflare dashboard sidebar)
4. Push any commit — `.github/workflows/deploy.yml` will fire.

If you don't want the redundant deploy path, delete `.github/workflows/deploy.yml`.

---

## Rollback

If a deploy breaks production:

1. Cloudflare Pages → Deployments → find the last-known-good deployment →
   click "..." → "Rollback to this deployment". Done in under 60 seconds.

If the issue is data (e.g. IndexNow worker mis-submitted URLs to bing):

1. There's no "undo" on IndexNow submissions; Bing just re-crawls. Wait it
   out.
2. If `LAST_PUBLISHED` KV got corrupted: Workers → KV → namespace → delete
   the `urls` key. Next run rebuilds the manifest from sitemap.

If DNS breaks:

1. CF dashboard → DNS → revert recent changes. Propagation is < 5min.

---

## Owen-side action list summary

In execution order, every item this guide asks Owen to do:

1. Register `bhamranked.com` (or chosen alternative) at Cloudflare Registrar.
2. Create Cloudflare account if needed.
3. Connect GitHub repo to Cloudflare Pages; set Build command + Node 22.
4. Point DNS at Cloudflare; add `bhamranked.com` + `www.bhamranked.com`
   as Pages custom domains.
5. Enable Cloudflare Web Analytics; paste beacon token into BaseLayout
   (uncomment + replace `CF_BEACON_ID_REPLACE_AFTER_DEPLOY`).
6. Generate `INDEXNOW_KEY`; create `public/{KEY}.txt`; set Production env
   var in CF Pages.
7. (Optional) Create `bhamranked-last-published` KV namespace; bind as
   `LAST_PUBLISHED`; flip `USE_DIFF=true` in `functions/indexnow.ts`.
8. Verify property in Google Search Console + Bing Webmaster Tools; paste
   tokens into BaseLayout (uncomment `<meta name="google-site-verification"`
   and `<meta name="msvalidate.01"`); submit sitemap from each console.
9. Run the smoke test checklist in step 9 above.
10. (Optional) Set up `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`
    GitHub secrets for the explicit deploy workflow; or delete
    `.github/workflows/deploy.yml`.
