/**
 * Dynamic per-piece Open Graph image generation.
 *
 * Generates a 1200×630 PNG for every published listicle + feature at build
 * time. URL pattern: /og/{slug}.png where slug is a flattened identifier:
 *
 *   listicle:   /og/listicle__{collection-entry-id-with-slashes-as-dashes}.png
 *   feature:    /og/feature__{collection-entry-id-with-slashes-as-dashes}.png
 *
 * Layouts pass `ogImage` to BaseLayout pointing at the matching URL.
 *
 * The image renders the piece title (large serif), an optional kicker
 * (category·sub-category for listicles, "Feature" for features), a visit
 * date range or list, and the no-paid-placement promise in the footer.
 */

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgPng } from '../../lib/og-template';

interface ParamRow {
  params: { slug: string };
  props: {
    title: string;
    kicker: string;
    byline: string;
  };
}

function fmtMonthYear(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function fmtVisitRange(start: Date, end: Date): string {
  const s = fmtMonthYear(start);
  const e = fmtMonthYear(end);
  return s === e ? `Visited ${s}` : `Visited ${s}–${e}`;
}

export async function getStaticPaths(): Promise<ParamRow[]> {
  const now = new Date();
  const out: ParamRow[] = [];

  const listicles = await getCollection('listicle', (e) => e.data.published !== null && e.data.published <= now);
  for (const entry of listicles) {
    const data = entry.data;
    const category = (data as { category: string }).category;
    const subCategory = (data as { sub_category: string }).sub_category;
    const slug = `listicle__${category}__${subCategory}__${data.slug}`;
    out.push({
      params: { slug },
      props: {
        title: data.title,
        kicker: `${category.replace(/-/g, ' ')} · ${subCategory}`,
        byline: fmtVisitRange(data.visit_date_range.start, data.visit_date_range.end),
      },
    });
  }

  const features = await getCollection('feature', (e) => e.data.published !== null && e.data.published <= now);
  for (const entry of features) {
    const data = entry.data;
    const slug = `feature__${data.slug}`;
    const firstVisit = data.visit_dates[0];
    const lastVisit = data.visit_dates[data.visit_dates.length - 1];
    out.push({
      params: { slug },
      props: {
        title: data.title,
        kicker: `Feature · ${data.spot_name}`,
        byline: firstVisit && lastVisit ? fmtVisitRange(firstVisit, lastVisit) : 'Visited',
      },
    });
  }

  return out;
}

export const GET: APIRoute = async ({ props }) => {
  const { title, kicker, byline } = props as ParamRow['props'];
  const png = await renderOgPng({ title, kicker, byline });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
