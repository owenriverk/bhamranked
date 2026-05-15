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
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  CATEGORY × SUB_CATEGORY                                    │
 *  │                                                             │
 *  │  The schema accepts four verticals so we can expand beyond  │
 *  │  food without a migration. Only food-and-drink has content  │
 *  │  at MVP. A Zod discriminated union constrains sub_category  │
 *  │  by category — picking `home-services` + `brunch` fails at  │
 *  │  build time.                                                │
 *  └─────────────────────────────────────────────────────────────┘
 */

import { defineCollection, z } from 'astro:content';

/* ──────────────────────────────────────────────────────────────────
 * SPOT — one ranked entry inside a listicle.
 * Generalized so home-services / personal-services / specialty-retail
 * pieces can use the same row without a schema migration.
 * ────────────────────────────────────────────────────────────────── */
const SpotSchema = z.object({
  rank: z.number().int().min(1).max(20),
  name: z.string().min(1, 'spot name required'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'slug must be lowercase-hyphenated'),
  neighborhood: z.string().min(1),
  price_tier: z.enum(['$', '$$', '$$$', '$$$$']),
  address: z.string().min(1, 'address required for LocalBusiness schema'),
  hours: z.string().min(1),
  /**
   * `booking` covers all booking modalities across verticals:
   *   - food-and-drink: "Walk-in only" / "Reservations via OpenTable" / "Online waitlist"
   *   - home-services: "By appointment" / "Same-day available" / "Booking via website"
   *   - personal-services: "Appointment required" / "Walk-ins welcome"
   *   - specialty-retail: "Walk-in" / "Curbside pickup"
   * Formerly `reservations`; renamed in Phase B for vertical neutrality.
   */
  booking: z.string(),
  visit_date: z.date(), // CRITICAL EEAT field — never optional
  photo: z.string().regex(/^[a-z0-9-]+\.(jpg|jpeg|png|avif)$/),
  takeaway: z.string().min(20).max(400),
  honest_critique: z.string().min(20, 'every spot needs an honest critique — required EEAT signal'),
});

const HonorableMentionSchema = z.object({
  name: z.string().min(1),
  reason: z.string().min(10),
});

const DISCLOSURE =
  'No business in this piece paid for placement, comped a meal, or had any influence over rankings.';

/* ──────────────────────────────────────────────────────────────────
 * VERTICAL DEFINITIONS
 * Each top-level category has its own allowed sub_category enum.
 * Discriminated union below makes invalid pairs a build error.
 * ────────────────────────────────────────────────────────────────── */
export const FOOD_AND_DRINK_SUBS = [
  'brunch',
  'coffee',
  'breweries',
  'dinner',
  'lunch',
  'bakeries',
] as const;

export const HOME_SERVICES_SUBS = [
  'plumbers',
  'electricians',
  'contractors',
  'landscapers',
  'roofers',
  'hvac',
] as const;

export const PERSONAL_SERVICES_SUBS = [
  'dentists',
  'vets',
  'salons',
  'fitness',
  'doctors',
] as const;

export const SPECIALTY_RETAIL_SUBS = [
  'outdoor-gear',
  'bookstores',
  'art-galleries',
  'music',
  'gift',
] as const;

export const CATEGORIES = [
  'food-and-drink',
  'home-services',
  'personal-services',
  'specialty-retail',
] as const;

export type Category = (typeof CATEGORIES)[number];

/* Pretty labels used for navigation and category landing pages. */
export const CATEGORY_LABELS: Record<Category, string> = {
  'food-and-drink': 'Food & Drink',
  'home-services': 'Home Services',
  'personal-services': 'Personal Services',
  'specialty-retail': 'Specialty Retail',
};

export const SUB_CATEGORY_LABELS: Record<string, string> = {
  // food
  brunch: 'Brunch',
  coffee: 'Coffee',
  breweries: 'Breweries',
  dinner: 'Dinner',
  lunch: 'Lunch',
  bakeries: 'Bakeries',
  // home
  plumbers: 'Plumbers',
  electricians: 'Electricians',
  contractors: 'Contractors',
  landscapers: 'Landscapers',
  roofers: 'Roofers',
  hvac: 'HVAC',
  // personal
  dentists: 'Dentists',
  vets: 'Vets',
  salons: 'Salons',
  fitness: 'Fitness',
  doctors: 'Doctors',
  // retail
  'outdoor-gear': 'Outdoor Gear',
  bookstores: 'Bookstores',
  'art-galleries': 'Art Galleries',
  music: 'Music',
  gift: 'Gift',
};

/* Map category → sub-category list. Drives category landing pages. */
export const SUBS_BY_CATEGORY: Record<Category, readonly string[]> = {
  'food-and-drink': FOOD_AND_DRINK_SUBS,
  'home-services': HOME_SERVICES_SUBS,
  'personal-services': PERSONAL_SERVICES_SUBS,
  'specialty-retail': SPECIALTY_RETAIL_SUBS,
};

/* Categories that have published content at MVP. The others render
 * a "Coming later in 2026" placeholder. */
export const ACTIVE_CATEGORIES: readonly Category[] = ['food-and-drink'];

/* ──────────────────────────────────────────────────────────────────
 * Listicle schema — discriminated union on `category` so each vertical
 * can only pick its own sub-categories. Picking `home-services` +
 * `brunch` is a build error.
 * ────────────────────────────────────────────────────────────────── */
const listicleBase = {
  title: z.string().min(10).max(80),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(120).max(160),
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
};

const listicle = defineCollection({
  type: 'content',
  schema: z.discriminatedUnion('category', [
    z.object({
      ...listicleBase,
      category: z.literal('food-and-drink'),
      sub_category: z.enum(FOOD_AND_DRINK_SUBS),
    }),
    z.object({
      ...listicleBase,
      category: z.literal('home-services'),
      sub_category: z.enum(HOME_SERVICES_SUBS),
    }),
    z.object({
      ...listicleBase,
      category: z.literal('personal-services'),
      sub_category: z.enum(PERSONAL_SERVICES_SUBS),
    }),
    z.object({
      ...listicleBase,
      category: z.literal('specialty-retail'),
      sub_category: z.enum(SPECIALTY_RETAIL_SUBS),
    }),
  ]),
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
