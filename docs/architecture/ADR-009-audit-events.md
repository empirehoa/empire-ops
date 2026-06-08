# ADR-009: Unified Audit Event Log

**Status:** Accepted  
**Date:** 2026-04-06  
**Author:** Claude (on behalf of JR Riestra)

## Context

HOA management is heavily regulated. Florida statutes require record-keeping for financial transactions, board decisions, and owner communications. Empire also needs an internal trail of AI actions to maintain accountability when AI-generated outputs affect homeowners.

## Decision

### Append-Only Design

- `audit_events` rows are **never updated or deleted**
- No `UPDATE` or `DELETE` RLS policy exists — those operations are blocked for all authenticated roles
- Reads are tenant-scoped via `audit_events_tenant_read` policy

### Write Path: `log_audit_event()` Function

All writes go through `log_audit_event()` — a `SECURITY DEFINER` function that runs with elevated privileges. Server-side API routes and server actions call this via the service-role Supabase client. This ensures:

1. Writes cannot be blocked by RLS (the function bypasses it)
2. Client-side code cannot insert audit events directly
3. All inserts are structured and validated by the function signature

### Schema Highlights

- **`actor_type`**: `human | ai | system` — distinguishes staff actions from VeraI actions from automated background processes
- **`action_category`**: `auth | data | financial | document | estoppel | ai | workflow | communication | admin`
- **`action`**: dot-notation string (e.g. `estoppel.delivered`, `ai.action.approved`)
- **`before_state / after_state`** (JSONB): optional diff capture for data changes
- **`ai_action_queue_id`** FK: links AI audit events to their originating queue item
- **`entity_type + entity_id`**: polymorphic reference to any record

### UI

- `/verai/audit` — chronological feed with category filter, actor filter, CSV export
- Separate `/settings/audit-log` (existing) handles admin-level audit access

### Indexes

6 indexes covering the primary access patterns:
- Tenant time-series feed
- Entity history
- Actor history
- Category filter
- Association-scoped feed
- AI queue cross-reference (partial — only rows with a queue ID)

## Consequences

- Table will grow indefinitely. Add a Supabase scheduled function to archive rows older than 7 years to cold storage (regulatory retention requirement for HOA financial records).
- `actor_email` is denormalized — this is intentional so the audit trail remains readable even after user accounts are deleted.

## Tables Added

- `audit_events` (migration 119)

## Functions Added

- `log_audit_event(...)` — SECURITY DEFINER, GRANT EXECUTE to `authenticated`
