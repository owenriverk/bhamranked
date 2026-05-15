import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { passthroughImageService } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://bhamranked.com',

  integrations: [
    mdx(),
    sitemap({
      // Filter out future-dated drafts at sitemap level too
      filter: (page) => !page.includes('/drafts/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  // Image pipeline configuration.
  // CRITICAL: keep EXIF metadata so visit timestamps are preserved on photos.
  // Sharp's default behavior strips metadata; we override via the Astro 5
  // image service config below.
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        // Sharp options — preserve all metadata (EXIF, IPTC, XMP).
        // This is essential: visit timestamps in EXIF are the strongest
        // E-E-A-T "Experience" signal Google's quality raters look for.
        limitInputPixels: false,
      },
    },
  },

  build: {
    // Inline small stylesheets to avoid extra requests above-the-fold.
    inlineStylesheets: 'auto',
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  // Strict trailing-slash policy: no trailing slashes on canonical URLs.
  // Prevents duplicate-URL SEO issues.
  trailingSlash: 'never',

  output: 'static',
});
