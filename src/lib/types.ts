/**
 * Shared component types.
 *
 * Components in `src/components/` need a Spot type without circularly
 * importing the full content collection schema. This file defines the
 * structural shape — Zod still owns validation at build time.
 *
 * If you change SpotSchema in src/content/config.ts, mirror it here.
 */

export interface Spot {
  rank: number;
  name: string;
  slug: string;
  neighborhood: string;
  price_tier: '$' | '$$' | '$$$' | '$$$$';
  address: string;
  hours: string;
  booking: string;
  visit_date: Date;
  photo: string;
  takeaway: string;
  honest_critique: string;
}

export interface HonorableMention {
  name: string;
  reason: string;
}
