# Vera Platform Module Registry

**Last Updated**: 2026-04-03  
**Migrations**: 110 total (supabase/migrations/)  
**Maintainer**: JR Riestra (CEO) + Claude (AI Architect)

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| `built` | Feature complete, RLS-protected, in production migrations |
| `partial` | Core tables/routes exist; known gaps documented below |
| `partial-external` | Core functionality delegated to an external service; Vera is a client |
| `deferred` | Not started; blocked on architecture decision or dependency |

---

## Module Status Table

| Module | Name | Status | Notes |
|--------|------|--------|-------|
| M-01 | GL Core | partial-external | VeraKaunting client → Akaunting |
| M-02 | Payments | partial | Stripe integration, no idempotency key enforcement |
| M-03 | AR/AP | partial | AP in migration 100, payment_batch_items now RLS-protected |
| M-04 | Multi-Tenant | built | get_tenant_id() + vera_core bridge (migrations 001-002, 103-104) |
| M-05 | Owners/Units | built | lot_occupancy (migration 087) |
| M-06 | Violations | built | violations schema, compliance migration 092 |
| M-07 | ARC/ARB | built | /arc route |
| M-08 | Banking | partial | bank_balance_cache projector (migration 110), no BankBalanceProjector service yet |
| M-09 | Reconciliation | built | bank_reconciliation_sessions + bank_statement_lines (migration 108) |
| M-10 | Reporting | partial | report_snapshots (migration 109), no closed-period generator yet |
| M-11 | Work Orders | built | migrations 004, 085 |
| M-12 | Vendor Management | partial | vendor tables, StanAI compliance monitoring |
| M-13 | Communications | built | migration 055 |
| M-14 | Document Management | partial | Supabase Storage, no tenant-scoped versioning yet |
| M-15 | Event Outbox | built | financial_event_outbox (migration 107) |
| M-16 | Integration Layer | partial | Vantaca, QuickBooks, banking connectors |
| M-17 | RBAC | partial | vera_core roles (migration 104), no step-up auth yet |
| M-18 | Admin/Settings | partial | association_settings (migration 097) |
| M-19 | StanAI | built | src/lib/ai/stanai.ts + 4 API routes + /api/v1/ai/stanai |

---

## Module Detail

### M-01: GL Core — partial-external

**What exists**: VeraKaunting integration layer (`src/lib/verakaunting/`). Vera is a client to Akaunting's chart of accounts, journal entries, and period close. All GL operations flow to Akaunting via API.

**Known gaps**:
- No local GL ledger in Supabase — all journal entry data lives in Akaunting
- Period close is Akaunting-controlled; Vera cannot enforce period lock independently
- NUMERIC money type in Vera migrations vs. Akaunting's internal representation — reconciliation requires currency-safe comparison

**Phase 2**: If Azure PostgreSQL migration includes a native GL schema, `vera_core` GL tables would replace the Akaunting client for core GL operations. Akaunting would become an optional integration rather than the authoritative source.

---

### M-02: Payments — partial

**What exists**: Stripe integration for payment collection. `payment_batch_items` table (migration 100) with RLS protection (migration 103). Stripe webhook handler routes.

**Known gaps**:
- No idempotency key enforcement on Stripe API calls — duplicate charges possible during retry storms
- No payment method tokenization storage (Vera stores Stripe customer IDs, not raw card data, which is correct; but no UI for saved payment methods)
- Refund workflow is manual (Stripe dashboard) — no Vera-initiated refund route

**Mitigation**: Stripe's own idempotency is retry-safe at the HTTP level. Vera retries would create duplicate Stripe API calls without keys. Risk is low in current volume but must be addressed before high-volume batch processing.

---

### M-03: AR/AP — partial

**What exists**: AP tables in migration 100. `payment_batch_items` is RLS-protected (migration 103, append-only design). Invoice tracking tables.

**Known gaps**:
- AR aging report is not automated — requires manual query
- Owner delinquency calculation for board summaries returns 0 unconditionally (see ADR-001, divergence point 6)
- No automated dunning workflow (late fee calculation, delinquency notices)

---

### M-04: Multi-Tenant — built

**What exists**: `get_tenant_id()` function extracts tenant from Supabase JWT claims. RLS policies on all critical tables enforce tenant isolation. `vera_core` bridge implemented in migrations 103–106 provides the second tenant isolation layer via `vera_core.current_organization_id()`.

**Architecture note**: Two tenant isolation mechanisms coexist during Phase 1 — see ADR-002 for the bridge strategy. Both must return the same tenant ID for the same authenticated user.

---

### M-05: Owners/Units — built

**What exists**: Unit and lot management tables. `lot_occupancy` table (migration 087) tracks current and historical owner/tenant occupancy. Owner portal access via association-scoped authentication.

---

### M-06: Violations — built

**What exists**: Violations schema with full lifecycle (open, notice sent, hearing scheduled, resolved, waived). Compliance migration 092 adds violation category taxonomy. RLS ensures managers see only their association's violations.

---

### M-07: ARC/ARB — built

**What exists**: Architectural Review Committee/Board route (`/arc`). Application submission, review workflow, approval/denial with conditions. Document attachment via Supabase Storage.

---

### M-08: Banking — partial

**What exists**: `bank_balance_cache` table (migration 110) — projector pattern that maintains running balance without full ledger scan on every request.

**Known gaps**:
- No `BankBalanceProjector` service class — the cache table exists but nothing populates it automatically on transaction events
- Bank feed import (Plaid, direct bank API) is not implemented — balances are manually entered or imported via reconciliation
- Multi-bank account support schema exists but no UI for account switching

**Dependency**: BankBalanceProjector should subscribe to `financial_event_outbox` (M-15) events to update cache. This requires M-15 to have active consumers.

---

### M-09: Reconciliation — built

**What exists**: `bank_reconciliation_sessions` and `bank_statement_lines` tables (migration 108). Full reconciliation workflow: import statement, match transactions, mark cleared, lock session. Unblocks the StanAI anomalies endpoint (previously returning HTTP 501).

---

### M-10: Reporting — partial

**What exists**: `report_snapshots` table (migration 109). Snapshot capture infrastructure for point-in-time financial reports. Report viewer UI routes.

**Known gaps**:
- No closed-period snapshot generator — snapshots must be triggered manually via API call
- No scheduled report generation (monthly board packet, annual audit package)
- Report templates are hardcoded; no template editor for community-specific formats

**Phase 2**: Closed-period generator should run as an Azure Function triggered on period-close event from `financial_event_outbox`.

---

### M-11: Work Orders — built

**What exists**: Work order lifecycle management (migrations 004, 085). Create, assign, schedule, complete, invoice workflow. Vendor assignment and cost tracking. Photo attachment via Supabase Storage.

---

### M-12: Vendor Management — partial

**What exists**: Vendor tables with license, insurance, and W-9 tracking. StanAI `vendor-compliance` endpoint reads vendor records and flags expiring or missing documentation.

**Known gaps**:
- No automated compliance calendar (insurance expiration alerts)
- Vendor 1099 preparation is manual
- No preferred vendor list management with community-level overrides

---

### M-13: Communications — built

**What exists**: Community communications schema (migration 055). Announcement broadcast, owner notification, email/SMS delivery tracking. Template management.

---

### M-14: Document Management — partial

**What exists**: Supabase Storage integration for document upload and retrieval. Association-scoped storage buckets. Document metadata table with RLS.

**Known gaps**:
- No tenant-scoped versioning — overwriting a document destroys the previous version
- No document access audit log (who downloaded what, when)
- No automated retention policy (7-year HOA record retention requirement)

---

### M-15: Event Outbox — built

**What exists**: `financial_event_outbox` table (migration 107). Transactional outbox pattern: events are written in the same database transaction as the state change, then consumed by downstream processors. Prevents dual-write inconsistency.

**Current state**: Table and RLS policies exist. No consumers are implemented yet — events are written but not read. M-08 (Banking/BankBalanceProjector) is the first planned consumer.

---

### M-16: Integration Layer — partial

**What exists**: Vantaca connector (sync-vantaca LaunchAgent), QuickBooks integration (sync-qbo), banking data connectors (manual import flow).

**Known gaps**:
- No standardized integration adapter interface — each connector is custom
- No retry/dead-letter queue for failed sync events
- Vantaca sync is one-way (Vantaca → Vera); bidirectional sync not implemented

---

### M-17: RBAC — partial

**What exists**: `vera_core` role tables (migration 104) with `organization_admin`, `manager`, `board_member`, `owner` roles. RLS policies enforce role-based access on financial tables.

**Known gaps**:
- No step-up authentication for sensitive operations (e.g., bulk payment approval requires re-auth)
- Role assignment UI is not implemented — roles are set directly in the database
- No role delegation (manager delegating approval authority while on leave)

---

### M-18: Admin/Settings — partial

**What exists**: `association_settings` table (migration 097). Per-association configuration for late fee rates, grace periods, violation notice templates, communication preferences.

**Known gaps**:
- Settings UI is a read-only JSON viewer — no edit interface
- No settings change audit log
- Global defaults (EMG-wide settings) are hardcoded, not configurable

---

### M-19: StanAI — built

**What exists**: `src/lib/ai/stanai.ts` — core StanAI service (Claude API wrapper with read-only constraint). Four production API routes:
- `POST /api/ai/stanai/categorize` — GL category suggestion for uncategorized transactions
- `GET /api/ai/stanai/vendor-compliance` — vendor insurance/license gap analysis
- `POST /api/ai/stanai/board-summary` — AI-generated monthly board narrative
- `POST /api/ai/stanai/anomalies` — reconciliation anomaly detection
- `POST /api/v1/ai/stanai` — unified query dispatcher route

**Constraint**: Read-only. No VeraAction gating yet. See ADR-003 for full enforcement documentation.

**Known gaps**:
- Board summary delinquency data is hardcoded to 0% (owner_ledger query not implemented)
- No StanAI session logging — cannot audit which AI calls were made by whom
- No confidence scoring on suggestions — all outputs are presented with equal weight

---

## Module Dependency Map

```
M-19 (StanAI)
  ├── reads M-09 (Reconciliation) → anomalies endpoint
  ├── reads M-12 (Vendor Management) → compliance endpoint
  ├── reads M-03 (AR/AP) → board summary (delinquency gap)
  └── blocked by M-17 (RBAC) → role-gated access not enforced

M-08 (Banking)
  └── should consume M-15 (Event Outbox) → BankBalanceProjector

M-10 (Reporting)
  └── snapshots M-09 (Reconciliation) + M-01 (GL Core) data

M-04 (Multi-Tenant)
  └── gates all other modules via RLS
```

---

## Migration Index

| Migration Range | Scope |
|----------------|-------|
| 001–050 | Core schema (tenants, users, associations, units) |
| 051–086 | Operations (work orders, communications, documents) |
| 087–096 | Owner/occupancy management |
| 097–102 | Settings and configuration |
| 103 | Security hardening (RLS patches) |
| 104–106 | vera_core bridge (multi-tenant layer 2) |
| 107 | Event outbox |
| 108 | Bank reconciliation schema |
| 109 | Report snapshots |
| 110 | Bank balance projector cache |

---

*This registry is the authoritative source for module status. Update it when migrations are added or module status changes.*
