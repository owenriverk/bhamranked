# bhamranked editorial pipeline

The end-to-end workflow from "I want to write about brunch" to "the piece is live and ranking." Optimized for Owen's 2 hrs/week constraint + AI agents on the supporting work + Owen's first-person Experience as the moat.

## The team

### Project-level agents (`.claude/agents/`)
| Agent | Role | Writes to |
|---|---|---|
| `bham-researcher` | Gathers verifiable facts + public coverage for candidate spots | `content/research/{category}-{date}.md` |
| `bham-scaffolder` | Generates listicle + feature outlines with `[OWEN INPUT NEEDED]` markers | `content/drafts/{category}-{format}-{date}.md` |
| `bham-weaver` | Integrates Owen's raw visit notes into the scaffold | `content/drafts/{category}-{format}-{date}-woven.md` |
| `bham-eeat-auditor` | Read-only quality gate (E-E-A-T scores + AI-slop detection) | Audit report (no file writes) |
| `bham-site-architect` | Next.js page scaffolding, schema markup, SEO meta, trust pages | `app/`, `content/published/`, sitemap, RSS |

### Gstack skills used in the pipeline
| Skill | When in pipeline | Purpose |
|---|---|---|
| `/humanizer` | After Owen's polish pass | Strip any remaining AI-voice tells |
| `claude-blog:blog-seo` | Before publish | Independent SEO checklist (alt to site-architect for SEO) |
| `claude-blog:blog-schema` | Before publish | JSON-LD validation (alt to site-architect for schema) |
| `claude-blog:blog-factcheck` | Optional, after weave | Verify facts against the dossier sources |
| `claude-blog:blog-writer` | Fallback only | If Owen wants AI-drafted prose for NON-first-person sections (e.g., neutral background paragraphs) |
| `/design-consultation` | Once, before piece #1 | Establish DESIGN.md so all pieces share a visual identity |
| `/plan-eng-review` | Once, before site code | Lock the Next.js architecture before code is written |
| `/qa` | After publish | Verify the live page renders, schema validates, lighthouse passes |

## The pipeline (per piece)

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: RESEARCH (agent)                                        │
│   Agent: bham-researcher                                        │
│   Input: category (e.g., "brunch") + candidate count (default 10)│
│   Output: content/research/{category}-{date}.md                 │
│   Owen time: 0 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: SCAFFOLD (agent)                                        │
│   Agent: bham-scaffolder                                        │
│   Input: dossier from step 1                                    │
│   Output:                                                       │
│     - content/drafts/{category}-listicle-{date}.md              │
│     - content/drafts/{category}-feature-{date}.md               │
│   Both with [OWEN INPUT NEEDED] markers everywhere voice goes.  │
│   Owen time: 0 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: VISIT (Owen, in-person, IRREPLACEABLE)                  │
│   Activities: eat, observe, photograph, take raw notes          │
│   Notes file: content/notes/{category}-{date}.md                │
│   Owen time: ~3-6 hours over a couple of weekends               │
│   Critical: photos must preserve EXIF (visit timestamps)        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: WEAVE (agent)                                           │
│   Agent: bham-weaver                                            │
│   Input: scaffold + notes                                       │
│   Output: content/drafts/{category}-{format}-{date}-woven.md    │
│   Preserves Owen's exact phrasing; adds connective tissue only  │
│   where strictly necessary (flagged with HTML comments).        │
│   Owen time: 0 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: OWEN'S POLISH PASS (Owen, irreplaceable)                │
│   - Review every <!-- weaver: transition --> comment            │
│   - Rewrite, replace, or delete transitions                     │
│   - Add anything missing (jokes, asides, voice)                 │
│   - Cross off every [OWEN INPUT NEEDED] marker                  │
│   Owen time: ~30-45 min per paired piece                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: HUMANIZER (gstack skill)                                │
│   Skill: /humanizer (Wikipedia "Signs of AI writing" framework) │
│   Pass the polished draft. It flags em dashes, AI vocab,        │
│   negative parallelism, rule-of-three, vague attributions,      │
│   "delve," "crucial," "robust," etc.                            │
│   Owen reviews flags; not all are wrong (sometimes a word fits).│
│   Owen time: ~10 min                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: E-E-A-T AUDIT (agent)                                   │
│   Agent: bham-eeat-auditor                                      │
│   Input: post-humanizer draft                                   │
│   Output: scored audit (Experience, Expertise, Authoritative,   │
│   Trust, AI slop). PASS / NEEDS_FIXES / FAIL verdict.           │
│   PASS thresholds: each EEAT dim ≥ 7, slop ≤ 2.                 │
│   Owen time: 0 minutes (review the audit, ~5 min)               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                  (if NEEDS_FIXES or FAIL → loop back to step 5)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 8: SITE INTEGRATION (agent)                                │
│   Agent: bham-site-architect                                    │
│   Tasks:                                                        │
│     - Move draft to content/published/{slug}.mdx                │
│     - Generate Next.js route (app/{category}/{slug}/page.tsx)   │
│     - Wire JSON-LD schema (ItemList, Review, Article, etc.)     │
│     - Set canonical, OG, Twitter Card meta                      │
│     - Update sitemap.xml, /feed.xml                             │
│     - Add internal links to companion piece + author bio        │
│   Owen time: 0 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 9: SCHEMA + SEO CHECK (gstack skills)                      │
│   Skills:                                                       │
│     - claude-blog:blog-schema (validates JSON-LD)               │
│     - claude-blog:blog-seo (on-page SEO checklist)              │
│   Independent second opinion on what site-architect produced.   │
│   Owen time: ~5 min reviewing the checklist                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 10: SHIP (gstack skills)                                   │
│   Skills:                                                       │
│     - /ship (PR + tests + diff review)                          │
│     - /land-and-deploy (merge + deploy + verify)                │
│     - /canary (post-deploy live check)                          │
│   Owen time: ~10 min approving the PR                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 11: LIVE VERIFICATION (gstack skill)                       │
│   Skill: /qa or /qa-only                                        │
│   Browses the live URL, validates schema (Rich Results Test),   │
│   checks Lighthouse, OG preview, mobile rendering.              │
│   Owen time: 0 minutes                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Owen's actual time per piece

| Step | Owen time |
|---|---|
| Visit (step 3) | 3-6 hours |
| Polish (step 5) | 30-45 min |
| Humanizer review (step 6) | 10 min |
| Audit + SEO review (steps 7, 9) | 10 min |
| Ship approval (step 10) | 10 min |
| **Total per paired piece** | **~5-8 hours** |

At 2 hrs/week, a paired piece (listicle + feature) takes 3-4 weeks. That's 12-17 paired pieces per year — well within the design doc's stated cadence target of ~10/year.

## How to invoke

Each agent is dispatched via the Agent tool with `subagent_type: <agent-name>`. The general pattern:

```
Agent({
  subagent_type: "bham-researcher",
  description: "Research Bellingham brunch spots",
  prompt: "Generate the research dossier for category=brunch with 10 candidate spots. Focus on places open weekends, including newer (post-2022) spots Yelp may underweight. Write to content/research/brunch-{today}.md."
})
```

Use `/humanizer`, `claude-blog:blog-seo`, etc. as skills via the Skill tool when they appear in the pipeline.

## What's expressly forbidden

- **Any agent generating first-person content.** All five agents have explicit "NEVER write first-person content" guardrails. If you catch one drifting, that's a bug — report it.
- **AI slop in published copy.** The eeat-auditor blocks publish if slop > 2. The slop bar is intentionally aggressive.
- **Pay-to-play language in editorial pieces.** Clean lanes between editorial and (future) paid directory listings. The /editorial-policy page is the trust foundation.
- **Photos without EXIF.** Owen's visit-timestamp metadata is the strongest Experience signal Google has. Don't strip EXIF on upload.

## Pipeline kickoff for the first piece (brunch)

```
1. Agent(bham-researcher, prompt="Brunch in Bellingham, 10 candidates, weekend service required")
   → content/research/brunch-{today}.md

2. Agent(bham-scaffolder, prompt="Scaffold brunch piece from today's dossier")
   → content/drafts/brunch-listicle-{today}.md
   → content/drafts/brunch-feature-{today}.md

3. OWEN: visit, eat, photograph, write raw notes
   → content/notes/brunch-{today}.md

4. Agent(bham-weaver, prompt="Weave notes/brunch-{today}.md into drafts")
   → content/drafts/brunch-listicle-{today}-woven.md
   → content/drafts/brunch-feature-{today}-woven.md

5. OWEN: polish pass on the woven drafts

6. Skill(/humanizer) on each draft

7. Agent(bham-eeat-auditor, prompt="Audit content/drafts/brunch-listicle-{today}-woven.md")
   → audit report; loop if needed

8. Agent(bham-site-architect, prompt="Integrate brunch listicle + feature for publish")
   → app routes, schema, meta, sitemap

9. Skill(claude-blog:blog-schema), Skill(claude-blog:blog-seo)
   → independent validation

10. Skill(/ship), Skill(/land-and-deploy)
   → PR, merge, deploy

11. Skill(/qa)
   → live verification
```

## Notes on running agents

- The five custom agents are project-level and live in `.claude/agents/`. They version-control with the repo.
- Each agent has its own tool allowlist (defined in its frontmatter). They cannot exceed those tools.
- Agents run with their own fresh context — they don't see the orchestrator's conversation. So pass them everything they need explicitly via the prompt.
- If an agent returns "I cannot find content/notes/..." it means Owen hasn't done step 3 yet. The workflow is sequential by necessity.
