# ADR-001: CTO Architecture Integration Strategy

**Status**: Proposed — Pending CTO Review  
**Date**: 2026-04-03  
**Authors**: JR Riestra (CEO), Claude (AI Architect)  
**Requires CTO Sign-off**: YES — this ADR must be reviewed by Isabel before Phase 1 implementation begins

---

## Context

Isabel (CTO) produced a comprehensive architecture specification for the Vera platform (`vera-blueprint.md`, Engineering Contract v4.3 FINAL) targeting:
- **Backend**: Laravel PHP 8.3 API
- **Frontend**: Angular
- **Database**: Azure PostgreSQL Flexible Server with `vera_core` schema
- **Auth**: Microsoft Entra ID (Azure AD)
- **Infrastructure**: Azure (App Service, Key Vault, Blob Storage, Service Bus)
- **AI Layer**: StanAI (Phase 8, read-only over financial data)

The existing Vera platform is built on:
- **Stack**: Next.js 14 App Router + TypeScript + Tailwind v4
- **Database**: Supabase PostgreSQL (public schema, 110 migrations)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: Claude API (Anthropic) — partial implementations in `src/app/api/ai/`

---

## Decision

**What we implemented immediately (does not require CTO sign-off):**

| Item | Action | Rationale |
|------|--------|-----------|
| CTO docs → `docs/` | Imported reference docs | Non-destructive; makes architecture visible |
| Security fixes (migration 103) | RLS on message_attachments + payment_batch_items | Critical security gap, independent of architecture |
| StanAI service (`src/lib/ai/stanai.ts`) | Read-only Claude API calls | Phase 8 concept, no writes, independent of VeraAction |
| StanAI API routes (4 endpoints) | `POST /api/ai/stanai/categorize`, `GET /api/ai/stanai/vendor-compliance`, `POST /api/ai/stanai/board-summary`, `POST /api/ai/stanai/anomalies` | All read-only; anomalies endpoint returns 501 until bank reconciliation tables are migrated |
| Azure Bicep template (`infra/azure-production.bicep`) | Infrastructure-as-code defined | Not deployed; definition only |
| Azure deploy workflow | GitHub Actions defined | Not active; requires secrets + CTO infra approval |
| Architecture admin page | Read-only status view | Visibility only, no functional change |
| `vera_core` schema (migrations 104–106) | Implemented via bridge approach — tables in Supabase, PostgREST access via public schema bridge views (`v_vera_core_*`) | Allows CTO SQL to run verbatim; bridge removed when migrating to Azure PostgreSQL in Phase 2 |
| Event outbox (migration 107) | `financial_event_outbox` table implemented | Enables reliable async event delivery pattern from CTO spec |
| Bank reconciliation schema (migration 108) | `bank_reconciliation_sessions` + `bank_statement_lines` implemented | Unblocks anomalies endpoint (previously returning 501) |
| Report snapshots (migration 109) | `report_snapshots` table implemented | Supports closed-period financial reporting |
| Bank balance projector (migration 110) | `bank_balance_cache` projector implemented | Enables real-time balance views without full ledger scans |
| `/api/v1/` routes | `organizations`, `associations`, `unified stanai` routes live | PostgREST-compatible API surface via bridge views |
| Alert & Escalation system (migrations 111–112) | `alert_rules`, `alert_escalation_levels`, `alert_instances`, `alert_processor_queue`; `dequeue_alert_batch()` RPC; 8 default rules seeded | Full alert lifecycle: trigger → escalate → acknowledge → resolve; idempotent via `UNIQUE(rule_id, entity_id, resolution_version)` |
| Text Blasts (migration 113) | `text_blasts` + `text_blast_recipients` tables; approval workflow | Mass SMS/email to homeowners with supervisor approval gate |
| StanAI expanded (12 capabilities) | homeowner_inquiry, meeting_minutes, rule_drafting, scope_of_work, mediation, bid_analysis, draft_communication, legal_summary added | 8 new AI capabilities beyond original 4; all read-only |
| StanAI UI (6 pages) | Playground, AI Analytics, Writing Assistant, Knowledge Base, Escalations, Alert Rules Builder | Full STAN parity UI layer |
| Brand token enforcement | All 52 files: `[#1C244B]` → `empire-navy`, `[#1C74AC]` → `empire-blue`, `[#F98761]` → `empire-coral` | Consistent Tailwind design token usage |
| Navigation wiring | Escalations in Operations, Alert Rules under Settings | Both pages now reachable from global nav |

**What was explicitly NOT implemented (requires CTO alignment first):**

| Item | Deferred Reason |
|------|----------------|
| Laravel API backend | Dual backend conflict — Next.js server actions and Laravel would both own DB writes with no clear authority boundary |
| Angular frontend | Existing Next.js investment; cannot parallelize two frontend frameworks |
| Microsoft Entra ID auth | Supabase Auth JWTs and Entra JWTs are cryptographically incompatible; requires replacing Supabase GoTrue |
| NUMERIC → BIGINT money migration | Existing 110 migrations use NUMERIC; conversion requires data validation and creates cross-schema arithmetic risks |

---

## Architecture Divergence Points

These are the decisions where the current Vera implementation diverges from the CTO's spec. Each requires an explicit alignment conversation:

### 1. Database Schema Strategy

**CTO's spec**: `vera_core` schema in Azure PostgreSQL; `organization_id` as tenant key; `SET LOCAL app.current_organization_id` RLS  
**Current Vera**: `vera_core` schema implemented in Supabase via bridge pattern (migrations 104–106); `tenant_id` as tenant key in public schema; bridge function `vera_core.current_organization_id()` reconciles both patterns

**Resolution needed**: The bridge is a transitional state. Azure PostgreSQL migration in Phase 2 removes the bridge and runs `vera_core` natively. Confirm Phase 2 timeline with CTO.

### 2. Authentication

**CTO's spec**: Microsoft Entra ID JWTs (Azure AD); `entra_object_id` as user identity anchor  
**Current Vera**: Supabase Auth JWTs; `auth.uid()` as user identity anchor

**Resolution needed**: Entra ID requires replacing Supabase GoTrue. All existing user sessions would be invalidated on cutover. This is a 2-4 week project that cannot be done incrementally.

### 3. Backend API

**CTO's spec**: Laravel PHP 8.3 API with VeraAction command bus pattern; thin controllers  
**Current Vera**: Next.js server actions and API routes; no VeraAction pattern

**Resolution needed**: If we adopt Laravel, the strangler fig pattern is recommended — route new features through Laravel, deprecate direct Supabase calls on a timeline. This is a 6-12 month project.

### 4. StanAI — AI Write Safety

**CTO's spec**: StanAI suggestions must flow through VeraAction before any write  
**Current implementation**: StanAI calls Claude API, returns suggestions only, no writes

**Gap**: Without VeraAction as a gating mechanism, the read-only constraint is enforced by code discipline only, not by system architecture. The risk is low today (no write functions are exposed to Claude) but will grow as StanAI capabilities expand.

**Mitigation in place**: StanAI functions only call `generateCompletion()` which is text-in/text-out. No database connections, no write functions, no tool use. Any developer adding tool calls with write access to StanAI functions is explicitly violating this constraint.

### 5. RLS Bridge Strategy

**CTO's spec**: `SET LOCAL app.current_organization_id` GUC-based RLS; session variable set by Laravel middleware before each query  
**Current Vera**: JWT-based RLS via `auth.uid()` and `get_tenant_id()` from Supabase Auth claims

**Bridge implemented**: `vera_core.current_organization_id()` function bridges both patterns. It first checks `current_setting('app.current_organization_id', true)` (the GUC-based CTO pattern); if empty, it falls back to extracting `organization_id` from the Supabase JWT claim (the current Vera pattern). This means CTO SQL that uses `vera_core.current_organization_id()` in RLS policies runs correctly in both environments without modification.

**Phase 2**: When Laravel middleware is in place setting the GUC before each request, the JWT fallback becomes a dead code path and can be removed.

### 6. StanAI — Known Data Gaps

**Board Summary delinquency**: The `POST /api/ai/stanai/board-summary` endpoint passes `delinquencyRate: 0` and `delinquencyAmount: 0` unconditionally. The owner_ledger query required to compute real delinquency has not been implemented. AI-generated board summaries will reflect 0% delinquency regardless of actual data until this is resolved.

**Append-only enforcement**: `payment_batch_items` has no DELETE RLS policy (append-only by design). However, Supabase `service_role` connections bypass RLS — hard-delete via service_role remains possible. True append-only enforcement requires a `BEFORE DELETE` trigger, which is deferred to a future hardening migration. All server-side code is trusted to use soft-delete patterns only.

---

## Reference Architecture

The CTO's SQL files are in `docs/db/` as reference architecture. They are **NOT active Supabase migrations** and should NOT be run against the Supabase project.

```
docs/db/000_create_vera_core_schema.sql  ← REFERENCE ONLY — not in supabase/migrations/
docs/db/001_create_access_control_tables.sql ← REFERENCE ONLY
docs/db/002_enable_rls.sql               ← REFERENCE ONLY
```

These represent the target state when Vera migrates to Azure PostgreSQL. They will become active migrations in a future `vera-api/` repository.

The `vera_core` schema is now live in Supabase via the bridge pattern (migrations 104–106). The reference SQL files in `docs/db/` represent the native Azure PostgreSQL version that does not require bridge views.

---

## Questions Requiring CTO Input

1. Is the Next.js + Supabase platform acceptable as a transitional state while the Laravel API is built?
2. What is the target date for the Entra ID auth migration?
3. Should StanAI be held until VeraAction exists, or is the current read-only implementation acceptable?
4. Is the Bicep infrastructure definition complete enough to proceed with a staging Azure deployment?
5. What is the Laravel API development timeline? Who owns it?
6. Should the board summary delinquency data gap be resolved before StanAI goes to production, or is 0% delinquency an acceptable placeholder?
7. Is the `vera_core` bridge approach (public schema views) acceptable as a Phase 1 transitional state, or does the CTO require native Azure PostgreSQL before any `vera_core` data is used in production?

---

## Consequence of Not Aligning

If this ADR is not reviewed and the CTO is shown an implementation that:
- Keeps Next.js (not Angular)
- Has `vera_core` running via bridge in Supabase (not native Azure PostgreSQL)
- Has StanAI live (before her Phase 8 timeline)
- Has Azure infrastructure defined but not by her team

...the risk is confusion, feeling of being overridden, or perception that her architecture is being ignored. This must be presented as "here's what we've done with your spec, here's what we deferred, here's what we need your input on" — not as "we've integrated everything."

---

*Architecture Decision Records are living documents. Update this ADR when decisions are made.*
