# Integration governance standards (Milestone 1)

Milestone 1 introduces shared governance primitives used by all adapters and BFF services:

- `src/lib/platform/integrations/policy.ts`
  - canonical per-engine runtime policy (`enabled`, mode, timeout/retry, failure mode, rollout flag, criticality).
- `src/lib/platform/integrations/types.ts`
  - shared integration warning/error/correlation/runtime policy types.
- `src/lib/platform/integrations/errors.ts`
  - normalized adapter error mapping and warning derivation helper.
- `src/lib/platform/adapters/base/base-adapter.ts`
  - runtime policy awareness and standardized warning helper for adapters.

These additions are **additive** and preserve the existing adapter factory/runtime model (`live|mock|disabled`) while making behavior consistent for current and future engine adapters.
