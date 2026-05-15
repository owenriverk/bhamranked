/**
 * Schema.org JSON-LD builders for bhamranked editorial pages.
 *
 * Each builder returns a plain object shaped as valid JSON-LD. Pass the
 * output to <SchemaLD blocks={...}> in a layout. Builders never invent
 * values — pass the data in, get the schema out.
 *
 * Builders implemented:
 *   - buildArticleSchema
 *   - buildItemListSchema
 *   - buildReviewSchema
 *   - buildLocalBusinessSchema
 *   - buildBreadcrumbSchema
 *   - buildPersonSchema (author bio)
 *   - buildOrganizationSchema (publisher)
 *   - buildWebsiteSchema (sitewide)
 */

import type { Spot } from './types';

const SITE_URL = 'https://bhamranked.com';

/* ──────────────────────────────────────────────────────────────────
 * Author / Publisher constants. These live here so any builder can
 * reference the canonical Owen and bhamranked Organization without
 * the caller re-supplying them. Update when Owen's bio changes.
 * ────────────────────────────────────────────────────────────────── */
export const AUTHOR_PERSON_ID = `${SITE_URL}/about#owen`;
export const PUBLISHER_ORG_ID = `${SITE_URL}#organization`;

export function buildPersonSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': AUTHOR_PERSON_ID,
    name: 'Owen',
    url: `${SITE_URL}/about`,
    description:
      'Editor of bhamranked. Bellingham, WA. Visits every spot in person, pays for every meal.',
    knowsAbout: [
      'Bellingham restaurants',
      'Pacific Northwest food',
      'Editorial reviews',
      'Local businesses',
    ],
    // [OWEN INPUT NEEDED] — populate sameAs with verified external profile
    // URLs (LinkedIn, Twitter/X, Instagram, personal site). These are the
    // single strongest "real person" signal Google's quality raters use
    // when assessing E-E-A-T. Empty array is valid schema but suboptimal.
    sameAs: [],
  };
}

export function buildOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': PUBLISHER_ORG_ID,
    name: 'bhamranked',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      'Bellingham, WA editorial directory. First-person reviews, no paid placement.',
    foundingDate: '2026',
    founder: { '@id': AUTHOR_PERSON_ID },
  };
}

export function buildWebsiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}#website`,
    url: SITE_URL,
    name: 'bhamranked',
    publisher: { '@id': PUBLISHER_ORG_ID },
  };
}

interface ArticleArgs {
  title: string;
  description: string;
  slug: string; // canonical path, e.g. "/food-and-drink/brunch/best-brunch-bellingham"
  published: Date;
  modified?: Date | null;
  type?: 'Article' | 'NewsArticle' | 'BlogPosting' | 'Review';
  /** Image URL for the Article (Google Rich Results recommends 1200×630). */
  image?: string;
}

export function buildArticleSchema(args: ArticleArgs): Record<string, unknown> {
  const url = `${SITE_URL}${args.slug.startsWith('/') ? args.slug : `/${args.slug}`}`;
  const mod = args.modified ?? args.published;
  const imageUrl = args.image
    ? args.image.startsWith('http')
      ? args.image
      : `${SITE_URL}${args.image}`
    : `${SITE_URL}/og-default.png`;
  return {
    '@context': 'https://schema.org',
    '@type': args.type ?? 'Article',
    headline: args.title,
    description: args.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: args.published.toISOString(),
    dateModified: mod.toISOString(),
    author: { '@id': AUTHOR_PERSON_ID },
    publisher: { '@id': PUBLISHER_ORG_ID },
    // image is REQUIRED for Article rich-results eligibility. We always
    // emit one — per-piece OG image when available, falling back to the
    // sitewide default.
    image: imageUrl,
  };
}

interface LocalBusinessArgs {
  spot: Spot;
  /** schema.org type override; defaults to LocalBusiness for non-food, Restaurant for food. */
  type?: string;
}

/*
 * NOTE: `openingHours` should be in schema.org's ISO-ish format
 * (`Mo-Fr 09:00-17:00`) for Google to parse it. The Spot.hours field is
 * free-form ("Sat-Sun 9a-2p") because it doubles as on-page display copy.
 * Emitting the free-form string as `openingHoursSpecification.description`
 * keeps it visible without misleading Google's parser. If we later want
 * machine-parseable hours, add a structured `hours_spec` field to
 * SpotSchema in src/content/config.ts and convert here.
 *
 * NOTE: bhamranked doesn't carry lat/lon for spots yet. If Owen starts
 * adding `geo` (latitude/longitude) to the SpotSchema, populate it here
 * — Google Rich Results uses it for map-pin enhancement.
 */
export function buildLocalBusinessSchema(args: LocalBusinessArgs): Record<string, unknown> {
  const { spot } = args;
  return {
    '@context': 'https://schema.org',
    '@type': args.type ?? 'LocalBusiness',
    '@id': `${SITE_URL}#${spot.slug}`,
    name: spot.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: spot.address,
      addressLocality: 'Bellingham',
      addressRegion: 'WA',
      addressCountry: 'US',
    },
    priceRange: spot.price_tier,
    // Free-form hours wrapped in a spec object — Google ignores the
    // description but on-page rendering can read it back.
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      description: spot.hours,
    },
  };
}

interface ReviewArgs {
  spot: Spot;
  reviewBody: string;
  /** 1-5 star equivalent. Listicles infer from rank; features pass a fixed score. */
  ratingValue?: number;
  bestRating?: number;
  /** schema.org type for itemReviewed; defaults to LocalBusiness. */
  itemType?: string;
  /** Page URL where this review is published. */
  reviewUrl?: string;
}

export function buildReviewSchema(args: ReviewArgs): Record<string, unknown> {
  const { spot, reviewBody, ratingValue, bestRating, itemType, reviewUrl } = args;
  const review: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    author: { '@id': AUTHOR_PERSON_ID },
    publisher: { '@id': PUBLISHER_ORG_ID },
    datePublished: spot.visit_date.toISOString(),
    reviewBody,
    itemReviewed: buildLocalBusinessSchema({ spot, type: itemType }),
  };
  if (ratingValue !== undefined) {
    review['reviewRating'] = {
      '@type': 'Rating',
      ratingValue,
      bestRating: bestRating ?? 5,
      worstRating: 1,
    };
  }
  if (reviewUrl) review['url'] = reviewUrl.startsWith('http') ? reviewUrl : `${SITE_URL}${reviewUrl}`;
  return review;
}

interface ItemListArgs {
  name: string;
  description: string;
  url: string;
  spots: Spot[];
  itemType?: string;
}

export function buildItemListSchema(args: ItemListArgs): Record<string, unknown> {
  const url = args.url.startsWith('http') ? args.url : `${SITE_URL}${args.url}`;
  const sorted = [...args.spots].sort((a, b) => a.rank - b.rank);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: args.name,
    description: args.description,
    url,
    numberOfItems: sorted.length,
    itemListElement: sorted.map((spot) => ({
      '@type': 'ListItem',
      position: spot.rank,
      item: buildReviewSchema({
        spot,
        reviewBody: spot.takeaway,
        // higher rank = higher rating; rank 1 → 5, rank 10 → 4 (cap floor at 3)
        ratingValue: Math.max(3, 5 - Math.floor((spot.rank - 1) / 3)),
        itemType: args.itemType,
      }),
    })),
  };
}

interface BreadcrumbStep {
  name: string;
  url: string;
}

export function buildBreadcrumbSchema(steps: BreadcrumbStep[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: step.name,
      item: step.url.startsWith('http') ? step.url : `${SITE_URL}${step.url}`,
    })),
  };
}
