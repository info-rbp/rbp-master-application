# Platform Search and Task Aggregation

## Architecture

Step 8 introduces two platform-owned subsystems:
- `src/lib/search/**` federates canonical search across Odoo, Lending, Marble, and internal platform data.
- `src/lib/tasks/**` aggregates actionable work across platform-stored tasks, workflow waiting states, Lending, Marble, and Odoo.

The API layer stays thin:
- `GET /api/search`
- `GET /api/search/quick`
- `GET /api/search/suggestions`
- `GET /api/tasks`
- `GET /api/tasks/summary`
- `POST /api/tasks/:id/actions/:action`

## Search model

Canonical search query fields:
- `query`, `tenantId`, `workspaceId`
- `entityTypes[]`, `modules[]`, `filters`
- `page`, `pageSize`, `sort`
- `currentUserId`, `correlationId`
- `includeSuggestions`, `includeCounts`, `mode`

Canonical result fields include:
- `entityType`, `moduleKey`, `title`, `subtitle`, `description`
- `route`, `sourceSystem`, `sourceRefs`
- `badges`, `highlights`, `matchedFields`, `score`

## Ranking rules

Current ranking is explicit and deterministic:
1. exact identifier/title matches
2. starts-with matches
3. contains matches
4. recent records
5. active/open states
6. configured sort override if requested

This is implemented in `src/lib/search/ranking.ts` and intentionally kept replaceable.

## Access control

Search entity access is enforced server-side in `src/lib/search/access.ts`:
- tenant scope always comes from the active session
- module visibility must be enabled in the session
- resource permission must exist in effective permissions
- internal-only domains (`customers`, `applications`, `loans`, `finance`, `workflow`, `case`) are hidden from external users

Counts and suggestions are derived only from already-accessible results so inaccessible records do not leak through metadata.

## Search strategy

This first version uses a hybrid federated strategy:
- live adapter calls for Odoo/Lending/Marble records
- internal projections for tasks and workflow instances

That keeps local development predictable without introducing heavyweight indexing infrastructure yet.

## Task aggregation model

Canonical task fields include:
- task identity, status, priority, urgency score
- tenant/workspace scope
- source system + source reference
- related entity links
- assignment / queue info
- due dates and actions

Canonical statuses:
- `open`, `in_progress`, `waiting_internal`, `waiting_external`, `blocked`, `completed`, `cancelled`

Canonical priorities:
- `low`, `normal`, `high`, `urgent`, `critical`

## Task ordering rules

Task ordering prefers:
1. overdue tasks
2. higher priority
3. tasks assigned directly to the current user
4. nearest due date
5. newer work

## Providers

Search providers:
- `OdooSearchProvider`
- `LendingSearchProvider`
- `MarbleSearchProvider`
- `InternalSearchProvider`

Task providers:
- `InternalTaskProvider`
- `WorkflowTaskProvider`
- `LendingTaskProvider`
- `MarbleTaskProvider`
- `OdooTaskProvider`

To add a new provider:
1. implement the provider interface
2. map source data into canonical contracts
3. add it to the service registry
4. cover ranking/filter/access behavior with unit tests

## Workflow, audit, and notification integration

- Workflow task hooks now persist canonical platform tasks in the task store.
- Workflow waiting/failure states also appear through the workflow task provider.
- Task actions record audit events.
- Assignment and escalation emit notifications with task deep links.
- Sensitive search scopes (finance/loan/case) emit audit records.

## Known limitations / roadmap

Current limitations:
- live search uses simple adapter-side listing plus platform ranking, not a dedicated full-text index
- some provider actions still return lightweight routed responses rather than deep source mutations
- summary counts are computed from aggregated result sets rather than a precomputed materialized view

Planned maturity steps:
- indexed projections for frequently searched entities
- richer suggestion models and entity-specific boosts
- deeper source-native task actions
- SLA policies, queue ownership, and assignment rules
- observability and provider health telemetry
