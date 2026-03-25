# Platform adapters (Step 4)

Step 4 introduces the first production-grade platform integration layer under `src/lib/platform`.

## Architecture

The adapter stack is split into four layers:

1. `src/lib/platform/integrations/*`
   - shared config parsing
   - canonical integration errors
   - tracing/correlation helpers
   - shared health types
   - reusable HTTP transport with timeout/retry/error mapping
2. `src/lib/platform/adapters/base/*`
   - typed adapter contracts and the base adapter helper
3. `src/lib/platform/adapters/{odoo,lending,marble,n8n}/*`
   - source auth helpers
   - source record types
   - response mappers
   - concrete adapter classes
4. `src/lib/platform/adapters/factory.ts`
   - real vs mock resolution
   - registry lookup for Step 5 BFF services

## Environment variables

### Shared

- `PLATFORM_INTEGRATION_TIMEOUT_MS` - default timeout for adapters. Defaults to `8000`.
- `PLATFORM_INTEGRATION_RETRY_COUNT` - default retry count for safe/idempotent requests. Defaults to `2`.
- `PLATFORM_INTEGRATION_DEBUG` - enables debug-oriented adapter logging outside production.

### Odoo

- `ODOO_BASE_URL`
- `ODOO_DATABASE` (optional depending on deployment/auth strategy)
- `ODOO_USERNAME`
- `ODOO_PASSWORD`
- `ODOO_API_KEY` (optional alternative to password)
- `ODOO_TIMEOUT_MS`
- `ODOO_RETRY_COUNT`
- `ODOO_MODE=live|mock|disabled` or `ODOO_MOCK=true`

### Frappe Lending

- `LENDING_BASE_URL`
- `LENDING_API_KEY`
- `LENDING_API_SECRET`
- `LENDING_USERNAME`
- `LENDING_PASSWORD`
- `LENDING_TIMEOUT_MS`
- `LENDING_RETRY_COUNT`
- `LENDING_MODE=live|mock|disabled` or `LENDING_MOCK=true`

### Marble

- `MARBLE_BASE_URL`
- `MARBLE_API_KEY`
- `MARBLE_TIMEOUT_MS`
- `MARBLE_RETRY_COUNT`
- `MARBLE_MODE=live|mock|disabled` or `MARBLE_MOCK=true`

### n8n

- `N8N_BASE_URL`
- `N8N_API_KEY`
- `N8N_TIMEOUT_MS`
- `N8N_RETRY_COUNT`
- `N8N_MODE=live|mock|disabled` or `N8N_MOCK=true`

## Local/mock mode

If a base URL is absent, the factory defaults that adapter to `mock` mode so local development does not crash the app.

Mock mode characteristics:

- returns stable typed DTOs
- reports healthy adapter status with `authStatus: unknown`
- keeps mocks fully inside the adapter layer
- allows future Step 5 BFF endpoints to be built before all upstream systems are reachable

To force a live adapter, set `<ADAPTER>_MODE=live` and supply the required credentials.

## Usage

Use the registry/factory from server-side platform services only:

```ts
import { getPlatformAdapter } from '@/lib/platform/adapters/factory';

const odoo = getPlatformAdapter('odoo');
const customers = await odoo.findCustomers({ search: 'Acme', limit: 10 }, { correlationId: 'req-123' });
```

Or compose multiple systems through `src/lib/platform/integrations/service.ts`.

## Adding a new adapter

1. Add shared DTOs if needed in `src/lib/platform/integrations/types.ts`.
2. Add any new auth/config fields in `src/lib/platform/integrations/config.ts`.
3. Create a new adapter directory with `*-types.ts`, `*-mappers.ts`, `*-auth.ts`, and `*-adapter.ts`.
4. Add the interface to `src/lib/platform/adapters/base/types.ts`.
5. Register live/mock resolution in `src/lib/platform/adapters/factory.ts`.
6. Add mapping, error, and mocked integration tests.

## Assumptions and TODOs

- Odoo auth is implemented using either bearer API key or basic credentials plus optional database header because Odoo deployments vary; Step 5 can swap in a richer session-backed auth helper if the production tenant requires it.
- Frappe Lending supports token auth (`token key:secret`) or basic auth depending on deployment.
- Marble and n8n are treated as HTTP API integrations with API-key auth.
- Health checks currently use lightweight ping endpoints and can be upgraded later with cached health probes, circuit breakers, and richer diagnostics.
- Retry policy is intentionally limited to safe/idempotent reads unless a write is explicitly marked retryable.
