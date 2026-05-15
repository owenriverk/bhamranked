/**
 * Vitest configuration for bhamranked.
 *
 * Tests live in `tests/` and run against the *built* `dist/` directory
 * (for HTML, sitemap, and link-integrity assertions). The EXIF test reads
 * directly from `src/assets/photos/`.
 *
 * Run modes:
 *   - `npm run test:once`  → single-pass CI run, exits with the right code
 *   - `npm run test`       → same as test:once (alias)
 *   - `npm run test:watch` → interactive
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // dist/-dependent tests can take several seconds when crawling files.
    testTimeout: 30_000,
    // Reporter `default` writes status to stderr while keeping the
    // assertion-failure context readable in CI logs.
    reporters: ['default'],
  },
});
