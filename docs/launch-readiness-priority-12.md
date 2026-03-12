# Priority 12 launch readiness

## Analytics readiness
- Analytics events are centralized in `src/lib/analytics.ts` via `ANALYTICS_EVENTS` constants.
- Critical gated-flow prompts are tracked (login required, membership required, upgrade required, locked CTA clicked).
- Public content view tracking uses typed events emitted from content detail rendering.

## SEO readiness
- Shared metadata helper in `src/lib/seo.ts` now powers page-level metadata and canonical URLs.
- `src/app/sitemap.ts` includes static public pages and published discovery items only.
- `src/app/robots.ts` allows public catalogue/index routes and disallows private/admin/API paths.

## Launch controls
- `src/lib/launch-readiness.ts` validates required environment groups (Firebase, Square, email, runtime URL).
- Content completeness checks verify homepage, membership, knowledge center, DocuShare, services, and offers.
- Admin surface: `/admin/system/launch-readiness` provides a lightweight operational preflight report.

## Performance and accessibility
- Public catalogue cards now use `next/image` for optimized loading.
- Public catalogue routes use `revalidate = 300` for cache-assisted rendering while preserving freshness.
- CTA links include explicit accessible labels where needed.

## Remaining manual checks before launch
1. Confirm all required environment variables are populated in staging and production.
2. Populate any page still showing fallback copy in launch-readiness warnings.
3. Validate monitoring alerts and incident response contacts.
4. Run UAT on gated journeys and Square checkout end-to-end.
