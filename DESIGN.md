# Design System — bhamranked

Locked 2026-05-14 via `/design-consultation`. Approved Variant A (reference-book intensity).

The reference preview lives at `~/.gstack/projects/bhamranked/designs/design-system-20260514/variant-A-approved.html` — open it any time to see the system rendered.

The runner-up Variant B (magazine-cover intensity) is preserved at `variant-B-runner-up.html` for future "Want bolder?" reference.

## Product context
- **What this is:** Bellingham, WA editorial food and drink directory. Ranked listicles + companion deep features. First piece: brunch.
- **Who it's for:** Seattle / Vancouver weekenders + new Bellingham transplants + locals fed up with Yelp + WWU students looking for one good answer.
- **Space:** Editorial review sites. Peers: The Strategist, Wirecutter, Eater, The Infatuation. Local non-peer: Bham Now (events news).
- **Project type:** content-first publishing site (Next.js + MDX). Not a SaaS dashboard.

## North star (the memorable thing)
**"Beautifully simple, fast to find the right spot."** Every design decision below serves this. If a future change does not serve it, reconsider.

## Aesthetic direction
- **Direction:** Editorial-restrained. Magazine inheritance from print food publications (Gourmet, Saveur) reinterpreted as a fast-loading single-page ranked answer.
- **Decoration level:** Minimal. One taste signal: warm-paper cream background (not sterile SaaS white). Zero gradients, illustrations, blobs, pattern fills, decorative graphics.
- **Mood:** Quiet authority. Confident enough to rank. Restrained enough to let typography and photos do the work.
- **Reference sites:** The Strategist (`nymag.com/strategist`), Wirecutter (`nytimes.com/wirecutter`), Substack publications, The Browser.
- **Layer-3 differentiation (eureka):** Most editorial directories optimize for "browse many things." bhamranked optimizes for "ONE good answer fast" — the page IS the ranked answer, not a magazine cover. #1 spot gets the hero; spots 2-10 are tight rows.

## Typography
- **Display / headlines / hero / spot names:** *Fraunces* (variable serif, Google Fonts). Default settings: `opsz: 144, wght: 400-500, SOFT: 30, WONK: 1`. Italic variant has more SOFT (50-80) for verdict pullquotes.
- **Body / long-form prose / paragraphs:** *Instrument Sans* (variable, Google Fonts). 18px default, line-height 1.65, measure capped at ~70ch.
- **Data / addresses / hours / visit dates / prices:** *Geist Mono* (Google Fonts, recently added). `font-variant-numeric: tabular-nums`. 11-13px for inline data, 10px for labels.
- **Fallbacks:** Georgia (display), system-ui (body), ui-monospace (data) — applied only if Google Fonts fails to load.

### Type scale
| Token | px | Used for |
|---|---|---|
| `--text-3xs` | 10 | Mono labels (kicker, data-row dt) |
| `--text-2xs` | 11 | Mono badges, fine print |
| `--text-xs` | 12 | Mono nav, mono meta |
| `--text-sm` | 13 | Mono data rows, byline |
| `--text-base` | 16 | Secondary body, captions |
| `--text-md` | 17-18 | Primary body, dek |
| `--text-lg` | 21 | Dek headline, larger body |
| `--text-xl` | 24 | Verdict pullquote, rank-row name |
| `--text-2xl` | 32 | Section headings |
| `--text-3xl` | 48 | Hero spot name, feature headline |
| `--text-4xl` | 64 | Article headline (listicle) |

### Type rules
- Display: tight tracking (`letter-spacing: -0.02em` to `-0.03em`), line-height 1.02-1.10
- Body: comfortable tracking (default), line-height 1.65, measure 65-72ch
- Italics carry verdict / pullquote energy — italic is meaningful, not decorative
- Mono carries data energy — never use mono for prose
- Never set body in Fraunces; never set verdicts in Instrument Sans; never set headlines in Geist Mono

## Color
Restrained palette. One accent (Salish slate) plus two contextual accents (verdict green, critique ochre). No more accents added without justification.

### Light mode
| Token | Hex | Role |
|---|---|---|
| `--bg-page` | `#FAF7F0` | Warm paper cream — bhamranked signature |
| `--bg-surface` | `#FFFFFF` | Cards, hero photo frames |
| `--bg-elevated` | `#F2EFE8` | Sidebars, critique callouts, hover states |
| `--text-primary` | `#14131A` | Body + display (slight warm tint, avoid SaaS-pure-black) |
| `--text-muted` | `#5E5C66` | Bylines, meta, captions, takeaway prose |
| `--border` | `#E5E1D8` | Hairlines, dividers |
| `--accent` | `#2E4A5F` | Salish Sea slate — links, rank numbers, focus rings |
| `--accent-deep` | `#1F3245` | Newsletter CTA background, hover-deepen variant |
| `--accent-verdict` | `#2E4A3A` | Mountain green for verdict pullquotes (italic Fraunces) |
| `--accent-critique` | `#8B6914` | Warm ochre for "the honest critique" callout |

### Dark mode
| Token | Hex | Role |
|---|---|---|
| `--bg-page` | `#14131A` | Same warm tint, inverted |
| `--bg-surface` | `#1C1B22` | Card lifting |
| `--bg-elevated` | `#232229` | Hover, critique |
| `--text-primary` | `#F0EDE6` | Body, display |
| `--text-muted` | `#9B9890` | Meta |
| `--border` | `#2C2B33` | Dividers |
| `--accent` | `#7AB0CD` | Salish slate desaturated for dark |
| `--accent-verdict` | `#7AB089` | Mountain green desaturated |
| `--accent-critique` | `#D9B262` | Warm ochre desaturated |

### Color rules
- Background is never pure white in light mode. The cream `#FAF7F0` is the bhamranked face.
- Accent (slate) is used sparingly: links, rank numbers, focus rings, the newsletter CTA. Not for headlines, not for body emphasis.
- Verdict color (`#2E4A3A`) is reserved for the italic verdict pullquote — one per piece, the editorial thesis.
- Critique color (`#8B6914`) is reserved for "the honest critique" callout — present in every piece (no perfect places), borderless on left except for the `4px solid --accent-critique` indicator.
- Photos drive visual color. The design system stays cool/restrained so warm food photos pop without competing.
- Never use: purple, violet, magenta, gradient accents, neon, pure red as a brand color.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable (not compact, not spacious). Editorial reading rhythm.
- **Scale:** 2xs(2), xs(4), sm(8), md(16), lg(24), xl(32), 2xl(48), 3xl(64), 4xl(96), 5xl(120)
- **Section gaps:** 64px between major bands on listicle pages; 80-96px on feature pages
- **Body line-height:** 1.65 (editorial reading rhythm — not the SaaS-tight 1.4)
- **Body measure:** capped at ~70ch (`max-width: 70ch`)

## Layout
- **Approach:** Hybrid. Grid-disciplined for listicle pages (the "one good answer fast" pattern). Creative-editorial for companion feature pieces (magazine spread feel).
- **Listicle page structure:**
  1. Masthead (logo + nav + theme toggle)
  2. Trust strip (no-paid pill + visit date + editorial policy link)
  3. Article header (kicker, headline, dek, byline)
  4. Hero #1 spot (2-column: photo + content)
  5. Ranked rows 02-10 (grid: rank-num | photo | content | meta)
  6. Honorable mentions (3-5 spots not ranked)
  7. Methodology + editorial policy disclosure
  8. Newsletter signup (slate accent background)
- **Feature page structure:** Magazine spread, asymmetric, more whitespace, mid-piece pullquotes acceptable.
- **Grid:** 12-column desktop, 4-column mobile. Max content width 1180px on listicle, 1280px on feature.
- **Border radius:** Hierarchical scale — `2px` for cards / surfaces, `3px` for input borders, `4px` for theme-toggle button, `999px` for trust pills. Never uniform radius across all elements.

## Motion
- **Approach:** Minimal-functional only.
- **Allowed:** photo lazy-load cross-fade (200ms ease), hover state color/underline shift (80ms ease), focus ring fade-in (100ms ease).
- **Forbidden:** entrance animations on scroll, parallax, hero rotators, marquee text, scroll-jacked sections, type-on animations, AOS / Framer-Motion-style page-load effects.
- **Easing:** `ease-out` for enter, `ease-in` for exit, `ease-in-out` for move.
- **Duration:** micro 50-100ms, short 150-250ms, medium 250-400ms (rare).
- **Rule:** if a user notices the motion, the motion is wrong.

## Editorial pattern library
These are the load-bearing patterns the design system must support. Listed for the bham-site-architect agent's reference.

### The trust strip
Above the article header. Contains:
- `<span class="pill">No paid placement</span>` (mountain green outline, dot prefix)
- Visit date(s) range (mono)
- Editorial policy link

### The article header
- Kicker line (mono, slate, uppercase, letterspaced)
- H1 headline (Fraunces, 40-76px clamp, max 18ch)
- Dek paragraph (21px, muted, max 56ch)
- Byline row (name + date + read time, mono small)

### The hero #1 spot
- 2-column grid (photo left, content right) at desktop; stacked on mobile
- Rank "01" floats top-left, absolute, Fraunces 52px, slate
- Photo placeholder: `linear-gradient(135deg, #D6B68A, #A8804A, #6B4E2B)` — warm desaturated tones, never bright stock-photo saturation
- Photo metadata pill (visit timestamp) bottom-right of photo, mono, dark overlay
- Content right column: spot name (Fraunces 48px), neighborhood (mono uppercase), verdict pullquote (italic Fraunces, mountain green, left border), body prose (Instrument Sans 18px), data row (mono grid), critique callout (ochre), feature link CTA (mono uppercase)

### The verdict pullquote
- Italic Fraunces, `SOFT: 50, WONK: 1`
- 24px on hero, 22-28px on rank rows if used
- Mountain green color (`--accent-verdict`)
- Left border 2-3px solid `--accent-verdict`
- Padding-left 18-24px
- One per piece. The editorial thesis sentence.

### The critique callout
- Background `--bg-elevated`
- Left border 3-4px solid `--accent-critique` (ochre)
- Label "The honest critique" in mono uppercase ochre
- Body in Instrument Sans 15-16px
- Present in every piece. Signals real editorial review. Required by the bham-eeat-auditor agent.

### Ranked rows 02-N
- 4-column grid: `60px | 110px | 1fr | auto`
- Rank number: Fraunces 38px, slate
- Mini photo: 4:3 aspect, photo gradient
- Content: spot name (Fraunces 24px) + takeaway sentence (Instrument Sans 15px, muted)
- Meta: mono right-aligned, visit date on top in text-primary, neighborhood + price below in muted
- Hover: subtle bg-elevated lift, negative-margin extension

### The data row (per spot)
- Grid: `auto 1fr`, gap `8px 22px`
- Labels in mono 10px uppercase muted
- Values in mono 13px text-primary
- Required fields: Address, Hours, Visited, Reservations (or "Walk-in only")
- Optional: Avg ticket, Phone, Accessibility, Reservations link

### The methodology section
- Top border 1px solid text-primary (heavy)
- 2-column grid: heading + body
- Heading in Fraunces 24px, 12ch max-width
- Body in Instrument Sans 16px muted, max 65ch
- Includes the editorial policy disclosure verbatim
- Editorial policy link in mono uppercase 12px

### The newsletter signup
- Background `--accent` (slate) on Variant A, `--accent-deep` on Variant B
- Light cream text
- Label in mono 11px letterspaced
- Headline in Fraunces 36px, max 22ch
- Email input + Subscribe button
- Fine print: "No spam. ~600 words. Unsubscribe in one click."

## Forbidden patterns (the AI-slop list)
- Pure white background `#FFFFFF` — use cream `#FAF7F0`
- Inter, Roboto, Space Grotesk, Arial, Helvetica, Open Sans, Lato, Montserrat, Poppins as primary fonts
- Purple, violet, magenta as any accent
- Gradient hero backgrounds
- 3-column icon-in-circle SaaS feature grids
- Centered-everything compositions
- Uniform bubble border-radius on all elements
- Em dashes — use commas, semicolons, or hyphens
- "Must-try," "hidden gem," "elevated," "boasts," "showcases," "stands out," "what sets this apart," "thoughtfully curated"
- Stock food photography (bright saturated marketing food)
- Decorative blobs, abstract shapes, geometric pattern overlays in content
- Hero CTAs with gradient buttons
- Scroll-driven parallax
- Entrance animations on viewport intersection
- Centered "Built for X" marketing copy

## Trust-infrastructure pages (required before launch)
Per `~/.gstack/projects/bhamranked/owen-main-design-20260514-184221.md` design doc. Each gets a route + design treatment:

- `/` — homepage (category cards + most-recent piece feature)
- `/about` — Owen's author bio with photo, Bellingham residency context, expertise, sameAs schema links
- `/editorial-policy` — the trust foundation. No-paid-placement statement, ranking criteria, corrections handling, last-verified policy
- `/methodology` — deeper detail on how Owen visits and reviews (optional but recommended)
- `/contact` — separate editorial inquiries from advertising/featured-listing inquiries

Each uses the same design system tokens. About + editorial-policy are typography-heavy long-form pages; design treatment closer to feature pages than listicles.

## Decisions log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-14 | Initial design system locked | Created by `/design-consultation`. Variant A (reference-book intensity) approved over Variant B (magazine-cover intensity). Memorable thing: "beautifully simple, fast to find the right spot." |
| 2026-05-14 | Salish slate accent over Wirecutter red | Cool slate complements warm food photos; ties site to place (Bellingham water/mountains); distinguishes from category-conventional red. |
| 2026-05-14 | Warm cream `#FAF7F0` bg over pure white | One taste deviation from category norm. Magazine paper feel without sacrificing speed. |
| 2026-05-14 | Fraunces + Instrument Sans + Geist Mono trio | Three voices for three content types: editorial display, long-form body, precise data. No Inter / Roboto / Space Grotesk (overused fonts blacklist). |
| 2026-05-14 | "One good answer fast" layout pattern | Layer-3 differentiation: page IS the ranked answer, not a magazine cover. Hero #1 + tight rows 02-10. Eureka logged. |
