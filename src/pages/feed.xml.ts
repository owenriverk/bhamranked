/**
 * RSS 2.0 feed for bhamranked editorial pieces.
 *
 * Includes every listicle + feature in the content collections whose
 * `published` field is a non-null date <= now. Drafts (null) and scheduled
 * (future date) entries are excluded — matching the same filtering Astro
 * applies at route generation. Auto-discovery <link> tag is wired in
 * BaseLayout already.
 *
 * Content strategy: ship the description (SEO meta blurb) as the item
 * summary plus a short factual block listing the spots covered and the
 * visit-date range. The full prose lives on-site — RSS subscribers
 * click through. This protects the EEAT signal (visit dates, photos)
 * that would be stripped if we shipped a flattened content body.
 */

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

const SITE_URL = 'https://bhamranked.com';
const FEED_TITLE = 'bhamranked';
const FEED_DESCRIPTION =
  'First-person editorial reviews of Bellingham, WA. No paid placement, no comped meals, no sponsored content.';

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(context: APIContext) {
  const now = new Date();

  const listicles = await getCollection('listicle', (entry) => {
    return entry.data.published !== null && entry.data.published <= now;
  });
  const features = await getCollection('feature', (entry) => {
    return entry.data.published !== null && entry.data.published <= now;
  });

  const listicleItems = listicles.map((entry) => {
    const data = entry.data;
    // discriminated union: data.category, data.sub_category always present on listicle
    const category = (data as { category: string }).category;
    const subCategory = (data as { sub_category: string }).sub_category;
    const link = `${SITE_URL}/${category}/${subCategory}/${data.slug}`;
    const allSpots = [data.hero_spot, ...data.ranked_spots].sort(
      (a, b) => a.rank - b.rank,
    );
    const visitStart = fmtDate(data.visit_date_range.start);
    const visitEnd = fmtDate(data.visit_date_range.end);
    const spotList = allSpots
      .map((s) => `${String(s.rank).padStart(2, '0')}. ${s.name} (${s.neighborhood})`)
      .join('\n');
    const description = [
      data.description,
      '',
      `Visited ${visitStart} through ${visitEnd}.`,
      '',
      'Ranked spots:',
      spotList,
      '',
      data.disclosure,
    ].join('\n');
    return {
      title: data.title,
      link,
      pubDate: data.published as Date,
      description,
      categories: [category, subCategory],
    };
  });

  const featureItems = features.map((entry) => {
    const data = entry.data;
    // feature lives under its parent listicle's category/sub-category. The
    // schema doesn't carry these directly, so we encode them in the URL
    // pattern: /features/{slug} routes are mounted under the parent path.
    // The feature data carries `parent_listicle` (the listicle slug). To
    // build the canonical URL we'd need the parent's category. For now we
    // emit the feature slug-only path; the canonical URL is corrected by
    // the redirect rules in public/_redirects. If the feature schema gains
    // explicit category/sub_category fields later, fix here.
    const link = `${SITE_URL}/features/${data.slug}`;
    const visits = data.visit_dates.map(fmtDate).join(', ');
    const description = [
      data.description,
      '',
      `${data.spot_name} · ${data.neighborhood}`,
      `Visited: ${visits}`,
      '',
      data.disclosure,
    ].join('\n');
    return {
      title: data.title,
      link,
      pubDate: data.published as Date,
      description,
    };
  });

  // Sort newest first so feed readers display the most recent piece on top.
  const items = [...listicleItems, ...featureItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
  );

  return rss({
    title: FEED_TITLE,
    description: FEED_DESCRIPTION,
    site: context.site?.toString() ?? SITE_URL,
    items,
    customData: '<language>en-us</language>',
  });
}
