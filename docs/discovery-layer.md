# Priority 7 Discovery Layer

## Search architecture

The catalogue now uses a **single server-side discovery adapter** in `src/lib/discovery.ts`.

- It pulls published/active content from existing source collections (DocuShare suites, Knowledge Center items, Partner Offers, Service pages).
- It normalizes those records into `DiscoveryItem` objects for search/filter/results rendering.
- It is not a second source of truth and does not introduce an external search SaaS.

## Filtering architecture

`applyDiscoveryFilters()` is the shared typed filter engine for:

- keyword
- category
- tag
- content type
- required tier

Filter option values are generated from live metadata via `getDiscoveryFilterOptions()`.

## Related-content and companion rules

`resolveRelatedDiscoveryItems()` ranks related resources in this order:

1. explicit `relatedContent` references
2. companion/related IDs derived from template fields and related metadata
3. category + shared tags heuristics
4. same-type and cross-journey boosts (template ↔ companion guide, guide → template/tool, service → knowledge)

Only published/active items are eligible, and the current item is always excluded.

## Public entry points

- `/search` provides universal public catalogue search + structured filters.
- Header now has a search icon link to `/search`.
- Detail pages use the reusable related-resource resolver for deeper content journeys.

## Analytics prep

Baseline discovery events are defined in `AnalyticsEventType`:

- `catalogue_search_performed`
- `catalogue_filter_applied`
- `catalogue_result_clicked`
- `related_resource_clicked`
- `companion_resource_clicked`

Current implementation logs search/filter executions where possible with existing analytics helpers.

## Future extension path

Later personalization/recommendations can build on `DiscoveryItem` without replacing public content models by adding:

- behavior-derived scoring signals
- per-user reranking
- optional async pre-indexing if catalogue size grows
