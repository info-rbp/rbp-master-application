# Type-Specific Public Page Templates

This phase replaces the generic public detail renderer with a shared shell plus type-specific section templates.

## Architecture

- Shared shell: `src/components/public/content-detail-shell.tsx`
  - Header, metadata badges, preview block
  - Access CTA zone (ready for future gating)
  - Related content block
- Template registry: `src/lib/detail-templates.ts`
  - Maps each `ContentObjectType` to structured sections
- Adapters: `src/lib/content-objects.ts`
  - Maps model fields into `templateFields` used by the shell

## Type mapping

- DocShare
  - `docshare_template`
  - `docshare_companion_guide`
  - `docshare_documentation_suite`
  - `docshare_end_to_end_process`
  - `docshare_tool`
- Partner offers: `partner_offer`
- Knowledge Center
  - `knowledge_center_article`
  - `knowledge_center_guide`
  - `knowledge_center_tool`
  - `knowledge_center_knowledge_base`
- Services: `service_page`

## Admin authoring alignment

- Partner offer admin now includes partner overview/services, why we recommend, and redemption code.
- Knowledge admin now supports structured arrays/text for takeaways, guide sections, resources, tool steps, and examples.

## Future paywall hook

The shell CTA block intentionally renders access states (`Access available`, `Login to access`, `Membership required`) without enforcing final entitlement flow yet. Final enforcement should hook into this block and action target routing.
