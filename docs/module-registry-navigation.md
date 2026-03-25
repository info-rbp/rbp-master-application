# Platform Module Registry and Navigation Service

## What this is

The platform module registry is the canonical source of truth for:

- what modules exist
- what routes belong to them
- which nav group they render in
- what permissions, flags, tenant capabilities, and workspace rules apply
- how the frontend decides what to show or hide

The registry is split into declarative definitions and pure evaluators so navigation is computed rather than hardcoded in components.

## Core files

- `src/lib/platform/types.ts`
- `src/lib/platform/module-registry.ts`
- `src/lib/platform/route-definitions.ts`
- `src/lib/platform/modules.ts`
- `src/lib/platform/route-access.ts`
- `src/lib/platform/navigation-builder.ts`
- `src/lib/platform/navigation-context.ts`

## How modules are defined

Each `ModuleDefinition` includes:

- identity: `key`, `name`, `description`
- UI metadata: `icon`, `order`, `navGroup`, `badges`
- rollout metadata: `isEnabledByDefault`, `isHidden`, `isInternalOnly`, `isBeta`
- access metadata: `requiredPermissions`, `requiredFeatureFlags`, `requiredTenantCapabilities`, `allowedWorkspaceTypes`
- structure metadata: `children`, `defaultLandingRoute`, `tags`

Add or change modules in `src/lib/platform/module-registry.ts`.

## How routes are defined

Each `RouteDefinition` includes:

- `path`
- `moduleKey`
- `routeType`
- `label`
- required permissions / flags / modules / tenant capabilities
- nav visibility controls
- access denied behavior
- optional match prefixes for route families

Add or change routes in `src/lib/platform/route-definitions.ts`.

## How access is evaluated

### Module access

`evaluateModuleAccess()` checks:

- tenant enablement
- feature flags
- permissions
- workspace type
- tenant capabilities
- hidden/internal-only rules

It returns a structured `ModuleAccessResult` with `visible`, `accessible`, and `reasonCodes[]`.

### Route access

`canAccessRoute()` checks:

- whether the route exists and is enabled
- whether authentication is required
- whether the route's module is accessible
- route-level permission requirements
- route-level feature flags
- route-level tenant capabilities
- route-level required modules

## How navigation is built

Navigation builders are pure functions:

- `buildPublicNavigation()`
- `buildPrimaryNavigation()`
- `buildWorkspaceNavigation()`
- `buildAdminNavigation()`
- `buildUserMenuNavigation()`

Each builder takes a `NavigationContext`, resolves visible modules and visible routes for those modules, and emits render-ready `NavigationItem[]`.

## How to add a new module

1. Add the module definition to `src/lib/platform/module-registry.ts`.
2. Choose its `navGroup`, `defaultLandingRoute`, permissions, and flags.
3. Add one or more routes in `src/lib/platform/route-definitions.ts`.
4. Ensure the tenant bootstrap/persistence layer enables the module where appropriate.
5. Add tests for visibility and access behavior.

## How to add a new route

1. Add a `RouteDefinition` in `src/lib/platform/route-definitions.ts`.
2. Attach it to the correct `moduleKey`.
3. Set `hideFromNav` if it should never render in navigation.
4. Set `accessDeniedBehavior` to either redirect or render access denied.
5. Add route access tests if the route has special behavior.

## Internal-only and feature-flagged modules

- Mark a module `isInternalOnly: true` to hide it from external users.
- Add `requiredFeatureFlags` to gate rollout.
- Add `requiredTenantCapabilities` when tenant configuration must explicitly support a module.

## Why this matters

This keeps the app from drifting back into scattered nav arrays and page-specific access logic. Future integrations can register or extend modules without rewriting layout components.
