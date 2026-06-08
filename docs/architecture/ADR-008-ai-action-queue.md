# ADR-008: AI Action Queue — Human-in-the-Loop Approval

**Status:** Accepted  
**Date:** 2026-04-06  
**Author:** Claude (on behalf of JR Riestra)

## Context

VeraI can generate communications, draft documents, post charges, and advance workflows. These AI-generated outputs must not execute automatically — Empire's operations require a human to review and approve before any action affects homeowners, financials, or legal documents.

## Decision

### Pattern: Generate → Queue → Approve → Execute

1. **VeraI generates** output (via any capability)
2. **Output is enqueued** in `ai_action_queue` with status `pending`
3. **Staff reviews** at `/verai/actions` — they can approve, reject, or modify the text
4. **Execution endpoint** (`/api/verai/actions/[id]/execute`) hard-checks `status IN ('approved', 'modified_approved')` server-side before doing anything. Client cannot bypass this.

### `ai_action_queue` Table

Key design decisions:

- **Polymorphic entity reference** (`entity_type` + `entity_id`) — actions can target any record type without schema changes
- **`ai_output` (JSONB)** stores the full structured AI payload; `generated_text` is a human-readable excerpt for quick review
- **`expires_at`** (7 days default) — stale pending items auto-expire; a partial index covers only `status = 'pending'` rows
- **`final_output`** — staff can edit text before approving (`modified_approved` status)
- **`execution_result` (JSONB)** — success/failure from the action executor, stored for audit trail

### Priority Levels

`low | normal | high | urgent` — maps to visual queue ordering in the UI

### UI

- `/verai/actions` — filterable queue by status, priority, action type
- `/verai/actions/[id]` — detail view: AI output diff, review form, execution result

## Consequences

- Every AI action adds latency (human review time). This is intentional and correct for the regulated HOA context.
- The execute endpoint is the only path to `executed` status — UI cannot mark items as executed directly.
- As volume grows, add a `assigned_to` filter to the My Queue widget to route by staff role.

## Tables Added

- `ai_action_queue` (migration 118)
