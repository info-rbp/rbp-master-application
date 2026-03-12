# Priority 4 Public Catalogue Layer

This project now treats public pages as catalogue surfaces fed by managed content collections.

## Public data sources

- `site_pages`: managed landing copy for home, membership, knowledge center, services, and DocuShare section framing.
- `documentation_suites` (+ nested `documents`): DocuShare catalogue items.
- `partner_offers`: partner marketplace catalogue items (public list requires `active === true`).
- `knowledge_articles`: knowledge catalogue items (public list requires `published === true`).
- `service_pages`: service catalogue items (public list requires `published === true`).
- `faqs`: membership FAQ entries (public list requires `published === true`).

## Published / active visibility rules

Public catalogue pages only render items that are published/active:

- DocuShare suites: `status === 'published'`.
- Partner offers: `active === true` (and expiry handled by existing content-admin helper logic).
- Knowledge content: `published === true`.
- Service pages: `published === true`.

## Route-to-data map

- `/docushare/*`: filtered `documentation_suites` plus `site_pages` framing content.
- `/partner-offers*`: active `partner_offers` mapped to catalogue cards.
- `/knowledge-center*`: published `knowledge_articles` mapped by content type.
- `/services`: published `service_pages`.
- `/membership*`: `site_pages` content with tier-entry framing into catalogue areas.
- `/`: curated featured slices from services/offers/knowledge plus managed homepage content.

## Preview metadata and future paywall hooks

Public catalogue cards now display value signals (summary, tags, category, required tier, preview availability, optional media) without enforcing protected actions.

Future paywall work should attach at the existing detail/action layers (`actionType`, gated download/redeem flows), not by hiding catalogue visibility.
