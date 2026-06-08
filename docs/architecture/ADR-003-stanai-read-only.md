# ADR-003: StanAI Read-Only Constraint

**Status**: Accepted  
**Date**: 2026-04-03  
**Authors**: JR Riestra (CEO), Claude (AI Architect)

---

## Context

The CTO's specification places StanAI in Phase 8 of the Vera roadmap and requires that any StanAI suggestion that would result in a write operation must flow through the VeraAction command bus before execution. VeraAction provides auditability, reversibility, and a clear human-approval gate between AI suggestion and database mutation.

StanAI has been implemented ahead of Phase 8 (see ADR-001) because the read-only surface is safe to build incrementally. However, VeraAction does not yet exist in the current Next.js implementation. This ADR documents how the read-only constraint is enforced today, what the known gaps are, and what the path to full VeraAction gating looks like.

---

## Decision

StanAI is implemented as a read-only AI advisory layer. It may read financial data and return structured suggestions. It may not write to any database table, trigger any financial transaction, or enqueue any side-effectful command without explicit human confirmation through a VeraAction gate.

---

## Current Enforcement Mechanism

The read-only constraint is enforced by **code discipline** — not by system architecture. This is a known gap (see below).

### What enforces the constraint today

**1. Text-in / text-out function signatures**

All StanAI functions in `src/lib/ai/stanai.ts` call `generateCompletion()`, which is a thin wrapper around the Anthropic `messages.create` API. The function signature is:

```typescript
async function generateCompletion(prompt: string): Promise<string>
```

There is no mechanism in this function to execute database writes, call Supabase, or invoke any external service. The output is always a string.

**2. No tool use configured**

The Claude API calls in StanAI do not pass a `tools` array. Without tool definitions, Claude cannot invoke external functions regardless of what it generates in its response. The model is running in pure text-generation mode.

**3. API route isolation**

StanAI API routes (`/api/ai/stanai/*`) accept read-only inputs (IDs, date ranges, category strings) and return structured JSON suggestions. None of these routes call Supabase write methods (`insert`, `update`, `delete`, `upsert`). The routes are:

- `POST /api/ai/stanai/categorize` — categorizes a transaction description, returns category string
- `GET /api/ai/stanai/vendor-compliance` — reads vendor records, returns compliance flags
- `POST /api/ai/stanai/board-summary` — reads financial summary data, returns narrative text
- `POST /api/ai/stanai/anomalies` — reads reconciliation data, returns anomaly list
- `POST /api/v1/ai/stanai` — unified route, read-only query dispatcher

**4. Developer constraint documented in code**

The StanAI module contains an explicit comment block:

```typescript
// STANAI READ-ONLY CONSTRAINT
// StanAI functions must never accept database write clients, mutation functions,
// or tool definitions that have side effects. All output is advisory only.
// Writes require VeraAction (Phase 2). See ADR-003.
```

---

## Known Gap: No VeraAction Gating

The CTO's architecture requires that StanAI suggestions flow through VeraAction before any write. VeraAction is a command bus pattern in the Laravel API that:

1. Accepts a `VeraAction` command object (type, payload, requesting user, timestamp)
2. Validates the command against business rules
3. Requires explicit human confirmation (API call or UI interaction)
4. Executes the write inside a transaction
5. Emits an audit event to the `financial_event_outbox`

**None of this exists today.** The current implementation has no VeraAction, no command bus, and no human-confirmation gate. The only thing preventing StanAI from writing is that no write functions have been provided to it.

**Risk assessment**: Low today. The risk grows proportionally with StanAI capability expansion. Any developer who adds tool definitions with write access to StanAI functions is explicitly violating this ADR without a VeraAction gate in place.

---

## Enforcement Rules (in effect until VeraAction exists)

The following rules apply to all StanAI development while VeraAction is not implemented:

| Rule | Rationale |
|------|-----------|
| No `tools` array in Claude API calls | Prevents function invocation |
| No Supabase write methods in StanAI route handlers | Prevents direct DB writes |
| No enqueueing to external queues or webhooks | Prevents async side effects |
| All StanAI routes must be `GET` or return read-only structured suggestions | Enforces intent at HTTP method level |
| Any new StanAI capability must be reviewed against this ADR before merging | Change control |

---

## Planned Path to VeraAction (Phase 2)

Phase 2 implementation of VeraAction requires the Laravel API backend (ADR-001, divergence point 3). The sequence is:

**Step 1 — Laravel VeraAction command bus**
Define `VeraAction` interface, command handlers, and the confirmation flow. This lives in Laravel, not Next.js.

**Step 2 — StanAI suggestion-to-action bridge**
StanAI returns a structured `VeraActionProposal` object instead of (or in addition to) a text suggestion. The proposal contains action type, payload, confidence, and a human-readable rationale.

```typescript
interface VeraActionProposal {
  actionType: 'CATEGORIZE_TRANSACTION' | 'FLAG_VENDOR' | 'APPROVE_RECONCILIATION';
  payload: Record<string, unknown>;
  confidence: number;        // 0.0 - 1.0
  rationale: string;
  requiresHumanApproval: boolean;  // always true in Phase 2
}
```

**Step 3 — UI confirmation gate**
Board members or managers see StanAI proposals in the UI with Accept / Reject controls. Acceptance POSTs to the Laravel VeraAction endpoint.

**Step 4 — Audit trail**
VeraAction writes an event to `financial_event_outbox` (migration 107) on every accepted action, including the proposing StanAI session, the human who confirmed, and the resulting database state change.

**Step 5 — Retire code-discipline enforcement**
Once VeraAction is the gate, the code-discipline rules in this section become redundant. They remain documented for historical context.

---

## Acceptance Criteria for Phase 2

StanAI is considered fully VeraAction-gated when:

- [ ] No StanAI suggestion can result in a database write without a `VeraAction` record being created first
- [ ] Every `VeraAction` record includes the StanAI session ID, the human approver, and the timestamp
- [ ] `financial_event_outbox` receives an event for every executed VeraAction
- [ ] StanAI can still operate in read-only advisory mode without requiring VeraAction (for summary, categorize, compliance endpoints)
- [ ] The confirmation UI is accessible to users with `board_member` or `manager` role only

---

## Related ADRs

- ADR-001: CTO Architecture Integration Strategy — Phase 8 StanAI context
- ADR-002: vera_core Schema in Supabase via Bridge Pattern — data access patterns StanAI reads

---

*Architecture Decision Records are living documents. Update this ADR when VeraAction implementation begins.*
