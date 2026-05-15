## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy,
/canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review,
/setup-browser-cookies, /setup-deploy, /setup-gbrain, /retro, /investigate, /document-release,
/document-generate, /codex, /cso, /autoplan, /plan-devex-review, /devex-review,
/careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn.

## Project: bhamranked

Bellingham, WA editorial directory. Strategy doc:
`~/.gstack/projects/bhamranked/owen-main-design-20260514-184221.md` (read this FIRST).

## Design System
Always read `DESIGN.md` before making any visual or UI decision. All font choices, colors, spacing, layout patterns, and aesthetic direction are defined there. Do not deviate without explicit user approval. The bham-eeat-auditor agent and any QA pass must flag code that doesn't match DESIGN.md.

The locked reference preview is at `~/.gstack/projects/bhamranked/designs/design-system-20260514/variant-A-approved.html` — open in browser any time to see the system rendered.

### Editorial north star (non-negotiable)
- Every published piece is grounded in Owen's first-person, in-person Experience.
- AI agents handle research, scaffolding, weaving, audits, and site infrastructure ONLY.
- Owen writes (or approves verbatim) every voice-bearing sentence.
- Editorial layer is clean-lanes — independent of any payment, sponsorship, or paid listing.
- Failure mode to avoid: AI-generated "best of" prose. Google's HCU + March 2024 core update penalize this aggressively.

### The agent team

Five project-level agents (in `.claude/agents/`) compose with gstack skills to produce pieces. The end-to-end pipeline is documented in `.claude/PIPELINE.md` — read it before invoking any agent for the first time.

| Agent | Use when |
|---|---|
| `bham-researcher` | First step of every piece. Gathers facts + public coverage. |
| `bham-scaffolder` | After research. Generates the listicle + feature outlines with `[OWEN INPUT NEEDED]` markers. |
| `bham-weaver` | After Owen has visited and written raw notes. Integrates notes into the scaffold. |
| `bham-eeat-auditor` | Before publish. Scored audit of Experience, Expertise, Authoritativeness, Trust + AI-slop detection. Read-only. |
| `bham-site-architect` | When wiring a piece into the Next.js site, or doing site-level infrastructure work (schema, sitemap, trust pages). |

### When the user mentions writing a piece

Default to the pipeline in `.claude/PIPELINE.md`:
1. `bham-researcher` → research dossier
2. `bham-scaffolder` → scaffolded drafts with markers
3. (Owen visits, writes notes in `content/notes/{category}-{date}.md`)
4. `bham-weaver` → woven drafts
5. (Owen polishes)
6. `/humanizer` → AI-voice tells removed
7. `bham-eeat-auditor` → final quality gate
8. `bham-site-architect` → site integration
9. `claude-blog:blog-schema`, `claude-blog:blog-seo` → independent validation
10. `/ship` → PR + deploy
11. `/qa` → live verification

### Content directory layout

```
content/
  research/     # bham-researcher output (dossiers)
  notes/        # OWEN'S raw visit notes (never touched by agents)
  drafts/       # bham-scaffolder + bham-weaver output (work in progress)
  published/    # published MDX, source of truth for live pieces
```

### Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas / brainstorming → invoke /office-hours
- Strategy / scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system / plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs / errors → invoke /investigate
- QA / testing site behavior → invoke /qa or /qa-only
- Code review / diff check → invoke /review
- Visual polish → invoke /design-review
- Ship / deploy / PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- AI-voice cleanup → invoke /humanizer
- Blog SEO / schema → invoke claude-blog:blog-seo or claude-blog:blog-schema

### Hard rules

- NEVER fabricate first-person content. NEVER claim a visit Owen didn't make. NEVER invent a dish, a server's name, or a room detail.
- NEVER strip EXIF metadata from Owen's photos — visit timestamps are a primary EEAT signal.
- NEVER add affiliate or sponsored content to editorial pieces.
- NEVER use em dashes, "delve," "crucial," "robust," "comprehensive," "vibrant," "elevated," "must-try," "hidden gem," "showcases," "boasts," "what sets this apart," or other AI-slop patterns in published copy.
- NEVER publish a piece that fails the `bham-eeat-auditor` PASS threshold (each E-E-A-T dim ≥ 7, slop ≤ 2).
