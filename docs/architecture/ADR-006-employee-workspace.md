# ADR-006: Employee Workspace — Global Search & Role-Based Dashboard

**Status:** Accepted  
**Date:** 2026-04-06  
**Author:** Claude (on behalf of JR Riestra)

## Context

Empire Management Group employees (property managers, finance staff, admins) needed a unified workspace inside Vera for day-to-day operations. Previously, navigation required knowing where things lived. Staff needed:

- Fast, global search across all entities (⌘K)
- Role-aware dashboard widgets (My Queue, Quick Links by department)
- A clear hub to jump into the most important actions

## Decision

### Global Search

- **⌘K command palette** (`src/components/search/command-palette.tsx`) — modal with grouped results, arrow-key nav, recent searches persisted to localStorage
- **`/api/search`** — 5-way parallel query: associations, contacts, work_orders, violations, vendors using PostgreSQL `tsvector` + GIN indexes (migration 116) with `ilike` fallback
- **`/search`** — full results page for when the palette needs more room
- **`search_history`** table logs queries per user for analytics

### Role-Based Widgets

- **`MyQueueWidget`** — shows the current user's pending AI action queue items
- **`QuickLinks`** — rendered per role (finance staff see Finance Hub + Payment Runs; managers see Estoppels + Work Orders + Violations)

## Consequences

- Search latency: ~100ms average due to GIN index. New rows will auto-update via trigger.
- `search_history` can grow large; add a retention cron (90-day TTL) as future work.
- The `ilike` fallback ensures search works before tsvector backfill completes on large tables.

## Tables Added

- `search_history` (migration 116)

## Alternatives Considered

- **Algolia / Typesense** — rejected; adds external dependency + cost for data that's already in Postgres. PostgreSQL FTS is sufficient for ~10K records per tenant.
