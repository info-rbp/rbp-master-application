# Priority 3 Content Object Architecture

## Shared contract

`src/lib/content-objects.ts` introduces a shared `RenderableContentObject` model and supporting enums for:
- content type and status
- access behavior
- CTA action metadata
- related content references

## Slug and route conventions

- Slugs are normalized via `normalizeSlug`.
- URL generation is standardized with `getContentObjectPath`.
- DocuShare suite detail pages use:
  - `/docushare/templates/[slug]`
  - `/docushare/companion-guides/[slug]`
  - `/docushare/documentation-suites/[slug]`
  - `/docushare/end-to-end-processes/[slug]`
- Individual uploaded resources now support `/docushare/resources/[slug]`.
- Partner offers now support `/partner-offers/[slug]`.

## Content-family adapters

Adapters map existing collection records into shared detail-ready objects:
- DocuShare suites and resources
- Partner offers
- Knowledge center items
- Service pages

## Admin upload-to-page flow

Document and suite admin forms now include page fields:
- slug
- summary
- tags
- status
- SEO title/description

Partner offer admin includes slug + richer details and stores page-capable fields.

## Next phases

Priority 5 can plug in specialized templates by content type while reusing the resolver and shared shell.
