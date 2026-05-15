/**
 * Astro content collection schemas — bhamranked
 *
 * These Zod schemas are the EEAT-enforcement layer for every published piece.
 * If Owen forgets `visit_date` or any required field, `npm run build` FAILS.
 *
 * Required fields are documented in /DESIGN.md and the engineering plan at
 * ~/.gstack/projects/bhamranked/owen-main-eng-plan-*.md
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  PUBLISH STATE                                              │
 *  │                                                             │
 *  │  published: null         → draft (excluded from build)      │
 *  │  published: 2026-05-20   → live (included after that date)  │
 *  │  published: 2026-12-01   → scheduled (excluded until date)  │
 *  └─────────────────────────────────────────────────────────────┘
 */

import { defineCollection, z } from 'astro:content';

const SpotSchema = z.object({
  rank: z.number().int().min(1).max(20),
  name: z.string().min(1, 'spot name required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase-hyphenated'),
  neighborhood: z.string().min(1),
  price_tier: z.enum(['$', '$$', '$$$', '$$$$']),
  address: z.string().min(1, 'address required for LocalBusiness schema'),
  hours: z.string().min(1),
  reservations: z.string(),
  visit_date: z.date(),              // CRITICAL EEAT field — never optional
  photo: z.string().regex(/^[a-z0-9-]+\.(jpg|jpeg|png|avif)$/),
  takeaway: z.string().min(20).max(400),
  honest_critique: z.string().min(20, 'every spot needs an honest critique — required EEAT signal'),
});

const HonorableMentionSchema = z.object({
  name: z.string().min(1),
  reason: z.string().min(10),
});

const DISCLOSURE = 'No business in this piece paid for placement, comped a meal, or had any influence over rankings.';

const listicle = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(10).max(80),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string().min(120).max(160),
    category: z.enum(['food-and-drink']),
    sub_category: z.enum(['brunch', 'coffee', 'breweries', 'dinner', 'lunch', 'bakeries']),
    author: z.literal('owen'),
    published: z.date().nullable(),
    last_verified: z.date().nullable(),
    visit_date_range: z.object({
      start: z.date(),
      end: z.date(),
    }),
    hero_spot: SpotSchema,
    ranked_spots: z.array(SpotSchema).min(5).max(15),
    honorable_mentions: z.array(HonorableMentionSchema).optional(),
    companion_feature: z.string().nullable(),
    disclosure: z.literal(DISCLOSURE),
  }),
});

const feature = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(10).max(80),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string().min(120).max(160),
    spot_name: z.string().min(1),
    address: z.string().min(1),
    neighborhood: z.string().min(1),
    author: z.literal('owen'),
    published: z.date().nullable(),
    last_verified: z.date().nullable(),
    visit_dates: z.array(z.date()).min(1),
    hero_photo: z.string(),
    parent_listicle: z.string(),
    disclosure: z.literal(DISCLOSURE),
  }),
});

export const collections = { listicle, feature };
