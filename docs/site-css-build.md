# Shared Site Styles

The three Japanese sites load a content-hashed CSS bundle instead of four or five separate stylesheets. Source stylesheets remain under `assets/`; change those sources, not the generated `site-reading.*.css` or `site-policy.*.css` files.

Run from the repository root after changing a source stylesheet:

```sh
node scripts/build-styles.cjs
python scripts/check-sites.py
node scripts/check-consent.cjs
```

The build preserves the exact source order for every page, including the older illustration-first pages. It validates all input pages before writing them, does not minify or rewrite CSS rules, and updates HTML links to the resulting content hash. Existing bundles can remain available for older cached HTML.

The check validates the original cascade order against the pre-bundle baseline commit `7088576`, checks for stale bundles, verifies local links and anchors, and parses the sitemap. A deliberate future cascade change requires reviewing and updating that baseline assertion.

PageSpeed lab results fluctuate and are not proof of search rankings, actual-user Core Web Vitals, conversions, or revenue. Compare results on the same URL and device class and retain the report links.

Consent markup is pre-rendered from `assets/analytics-consent.html` and its visibility is decided by a small first-paint script in each HTML head. This prevents an asynchronous banner from pushing the article down. Analytics still requires explicit opt-in. When initially adding the markup to a new page, run `node scripts/wire-consent.cjs`; review markup changes separately because the wiring script intentionally does not overwrite existing panels.
