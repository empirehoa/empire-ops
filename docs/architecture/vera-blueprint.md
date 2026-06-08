# VERA — Complete Execution Blueprint
### Principal TPM / Fintech Architect / SaaS CTO Edition
> Version: Derived from vera-financial-core.yaml v2.1.0 + Engineering Contract v4.3 FINAL

---

## GUIDING PRINCIPLE

> **"We are not building features. We are building a financial system that features depend on."**

Every decision in this document flows from that principle. Financial integrity is not a feature — it is the substrate. If the substrate is wrong, every feature built on top is wrong.

---

# SECTION 1 — COMPLETE SYSTEM MODULE BREAKDOWN

## Module Registry

### M-01 · Financial Core (GL, Ledger, Journal Entries, Periods)
- **Purpose:** The double-entry accounting engine. Every dollar that moves through Vera is recorded here. Source of truth for all financial state.
- **Depends On:** Tenant/Association structure, RLS, Audit Logs
- **Risk Level:** 🔴 HIGH — Errors here corrupt all downstream reporting, banking, and AP
- **Build Priority:** 1
- **Key Enforcements:** BIGINT/integer minor units only. No floats. Balanced entries only. Immutable after posting. Closed-period block on all writes.

---

### M-02 · Payments (Stripe, ACH, Lockbox)
- **Purpose:** Collect homeowner assessments and other receivables via external payment rails.
- **Depends On:** M-01 (GL), M-03 (AR), M-08 (Banking), M-16 (Integration Layer)
- **Risk Level:** 🔴 HIGH — Double-charges, missed postings, idempotency failures are catastrophic
- **Build Priority:** 4
- **Key Enforcements:** Idempotency keys mandatory. Webhook deduplication. Every payment must produce a GL entry via AccountingEntryFactory.

---

### M-03 · AR / AP Automation
- **Purpose:** Homeowner billing (AR) and vendor invoice processing (AP). Drives cash flow tracking.
- **Depends On:** M-01 (GL), M-08 (Banking), M-12 (Vendor Management)
- **Risk Level:** 🔴 HIGH — Invoice approval bypass or duplicate payment is a financial crime exposure
- **Build Priority:** 4
- **Key Enforcements:** Approved invoices are locked. Rejection required before re-edit. One-to-one payment per invoice in Phase 1. Vendor hold blocks processing.

---

### M-04 · Associations / Multi-Tenant Structure
- **Purpose:** Core organizational unit. Every financial record belongs to a tenant → association hierarchy.
- **Depends On:** Nothing (this IS the foundation)
- **Risk Level:** 🔴 HIGH — Tenant isolation failure is a deployment blocker
- **Build Priority:** 1
- **Key Enforcements:** RLS on every table. SET LOCAL (never SET). NULL/empty session → zero rows. Two-tenant seeder required.

---

### M-05 · Owners / Residents / Units
- **Purpose:** The homeowner data model. Drives AR, payment collection, violation tracking, and communications.
- **Depends On:** M-04 (Associations)
- **Risk Level:** 🟡 MEDIUM — Data accuracy affects billing and compliance
- **Build Priority:** 3
- **Key Enforcements:** Unit-to-owner relationships must be versioned (move-ins/move-outs affect AR history).

---

### M-06 · Violations / Compliance
- **Purpose:** Track community rule violations, fines, and resolution workflow.
- **Depends On:** M-04, M-05, M-01 (for fine posting)
- **Risk Level:** 🟡 MEDIUM — Fine posting must produce GL entries
- **Build Priority:** 5
- **Key Enforcements:** Fine amounts post to GL via journal entry, never directly.

---

### M-07 · ARC / ARB (Architectural Review)
- **Purpose:** Homeowner modification request workflow with board approval.
- **Depends On:** M-04, M-05
- **Risk Level:** 🟢 LOW — No financial transactions; workflow only
- **Build Priority:** 6
- **Key Enforcements:** Document attachment to decisions. Audit trail required.

---

### M-08 · Banking (Bank Accounts, Register, Deposits, Transfers)
- **Purpose:** Tracks bank accounts, cash positions, deposits, transfers, and reconciliation-ready register.
- **Depends On:** M-01 (GL — every bank account maps to a GL cash account)
- **Risk Level:** 🔴 HIGH — Book balance drift = financial misstatement
- **Build Priority:** 4
- **Key Enforcements:** Single-writer pattern for cached book balance (BankBalanceProjector only). Reconciled entries cannot be deleted. Every register entry references a source_type.

---

### M-09 · Reconciliation
- **Purpose:** Match bank statement transactions to register entries. Produces reconciliation reports.
- **Depends On:** M-08, M-01, M-10 (Reporting)
- **Risk Level:** 🔴 HIGH — Undetected mismatches = audit failure
- **Build Priority:** 5
- **Key Enforcements:** Sessions are append-only. Auto-match + manual-match with full audit. Closed periods block unreconciling.

---

### M-10 · Reporting / Dashboards (Board + Manager views)
- **Purpose:** Trial balance, balance sheet, income statement, GL history, bank register, reconciliation reports.
- **Depends On:** M-01, M-08, M-09 — served from snapshots for closed periods, read replica for live
- **Risk Level:** 🟡 MEDIUM — Wrong reports mislead boards and trigger audits
- **Build Priority:** 6
- **Key Enforcements:** Closed-period reports from snapshots only (never live ledger reads). Read replica for all reporting queries.

---

### M-11 · Work Orders / Maintenance
- **Purpose:** Track maintenance requests, vendor assignments, and completion.
- **Depends On:** M-04, M-12 (Vendor Management), M-03 (AP — work orders may generate invoices)
- **Risk Level:** 🟢 LOW — Operational, not financial
- **Build Priority:** 6

---

### M-12 · Vendor Management
- **Purpose:** Vendor records, compliance (COI, W9, TIN match), documents, holds.
- **Depends On:** M-04
- **Risk Level:** 🟡 MEDIUM — Vendor hold failure enables payment to non-compliant vendors
- **Build Priority:** 4
- **Key Enforcements:** Tax ID encrypted at rest. TIN match tracked. COI expiration triggers hold. Vendor hold blocks invoice processing.

---

### M-13 · Communications (Email + SMS)
- **Purpose:** Homeowner and board communications, violation notices, payment reminders.
- **Depends On:** M-04, M-05, M-15 (Notifications/Events)
- **Risk Level:** 🟢 LOW — Delivery failures are operational, not financial
- **Build Priority:** 6

---

### M-14 · Document Management
- **Purpose:** Contracts, financial records, COI uploads, W9 documents, ARC decisions.
- **Depends On:** M-04, M-12, M-07
- **Risk Level:** 🟡 MEDIUM — Document loss = compliance exposure
- **Build Priority:** 5
- **Key Enforcements:** Azure Blob/S3-compatible. Versioned. Access-controlled by tenant/association.

---

### M-15 · Notifications + Event Outbox
- **Purpose:** Event-driven side effects. Every financial write emits an outbox event in the same transaction.
- **Depends On:** M-01 (must be in same transaction as financial write)
- **Risk Level:** 🔴 HIGH — Missed outbox events = silent notification failures, reconciliation gaps
- **Build Priority:** 4
- **Key Enforcements:** Written in SAME transaction as financial write. Dead-letter after 5 retries. Schema versioning on all events.

---

### M-16 · Integration Layer (Vantaca, Banking APIs, External)
- **Purpose:** Bidirectional sync with Vantaca, banking integration (Stripe, ACH), and third-party APIs.
- **Depends On:** All core modules
- **Risk Level:** 🔴 HIGH — Data sync errors create phantom records or financial mismatches
- **Build Priority:** 7
- **Key Enforcements:** All inbound data must be validated before posting to GL. Idempotency keys on all external event handlers.

---

### M-17 · RBAC / Permissions
- **Purpose:** Role-based access control across all modules and financial operations.
- **Depends On:** M-04
- **Risk Level:** 🔴 HIGH — Permission failure = unauthorized financial writes
- **Build Priority:** 1
- **Key Enforcements:** Laravel Policies enforced at service layer. High-risk actions (reopen period, year-end close, reverse entry) require elevated role. Step-up auth for high-risk actions.

---

### M-18 · Admin / Global Settings
- **Purpose:** Tenant-level and system-level configuration, fiscal year settings, feature flags.
- **Depends On:** M-04
- **Risk Level:** 🟡 MEDIUM
- **Build Priority:** 5

---

### M-19 · AI / Automation (StanAI)
- **Purpose:** AI-assisted categorization, anomaly detection, report summarization, vendor compliance monitoring.
- **Depends On:** ALL core modules (reads from, never writes to financial core directly)
- **Risk Level:** 🟡 MEDIUM — AI must NEVER write to GL directly
- **Build Priority:** 8
- **Key Enforcements:** Read-only access to financial data. All AI-suggested actions must flow through standard VeraAction classes. No direct model writes from AI layer.

---

# SECTION 2 — PHASED EXECUTION PLAN

## Phase 0 · Infrastructure (Week 0 — Before Any Code)

**Goal:** Development environment is stable, reproducible, and team-aligned.

**What is built:**
- Docker Compose environment (app, worker, scheduler, postgres:16, redis:7, mailpit)
- PostgreSQL `vera_core` schema (NOT public schema — v4.3 ENFORCED)
- CI pipeline skeleton (lint, test, migrate)
- `.env.example` complete with all required variables
- Git branching strategy defined
- Two-tenant seed data requirement documented

**What is NOT built yet:** Any application code.

**Lock before Phase 1:** Docker environment boots cleanly. Schema `vera_core` exists. CI runs migrations. All engineers reproduce locally in under 10 minutes.

---

## Phase 1 · Financial Core Foundation (Weeks 1–2) ← CURRENT PHASE

**Goal:** Secure multi-tenant structure, financial period lifecycle, GL foundation, audit logging, passing isolation tests.

**What is built:**
- API-first Laravel, `/api/v1`
- `ResolveTenantContext` + `RequireAssociationAccess` middleware
- `TenantContext` / `TenantContextResolver` support classes
- Models: Tenant, Association, AssociationUser, FinancialPeriod, FinancialPeriodTransition, GlGroup, GlAccount, AuditLog
- Traits: `BelongsToTenant`, `BelongsToAssociation`, `AssociationScope`
- Services: `FinancialPeriodService`, `ChartOfAccountsService`, `AuditLogService`
- VeraAction pattern established (all writes through actions)
- RLS policies on all foundation tables — NULL/empty session = zero rows
- RBAC roles: finance_admin, accounting_staff, community_manager, board_member, auditor, read_only_financial
- All Phase 1 API endpoints (health, periods CRUD + transitions, GL groups list, GL accounts CRUD)
- Audit logs: synchronous, in-transaction, rollback on failure
- UUIDs: application-layer generated (never database-side)
- Money: BIGINT/integer cents only
- `vera_core` PostgreSQL schema (not public)
- SET LOCAL for session variables (never SET)
- Two-tenant seeder with identical association names
- Full test suite: tenant isolation, period lifecycle, GL uniqueness, audit capture, policy authorization

**What is NOT built yet:** GL entries, banking, AP, payments, reconciliation, outbox, snapshots, year-end close, any Phase 2+ modules.

**Risks if done incorrectly:**
- RLS without NULL guard → session-less queries return data (CRITICAL)
- SET instead of SET LOCAL → connection pool leaks tenant context (CRITICAL)
- Float money → precision drift corrupts all downstream math (CRITICAL)
- Model writes outside VeraAction → bypasses audit and enforcement (BLOCKING)
- Database-side UUID generation → loses application-layer control (BLOCKING)

**Lock before Phase 2:** All tests pass. Tenant isolation verified. No float money. No direct model writes. Audit logs synchronous and in-transaction. RLS with NULL guard deployed.

---

## Phase 2 · Payments + AR/AP + Banking + Events (Weeks 3–6)

**Goal:** Money actually moves. Full accounting cycle from invoice to payment to GL entry.

**What is built:**
- GL Entries + GL Entry Lines (double-entry, balanced, immutable after posting)
- Idempotency keys on all posting paths
- Bank Accounts (mapped to GL cash accounts)
- Bank Register Entries
- Deposits + Transfers
- BankBalanceProjector (single-writer, cached book balance)
- Vendors + Vendor Documents + VendorComplianceService
- Invoices + Invoice Approval Steps + InvoiceWorkflowService
- Payments (one-to-one per invoice, Phase 2 constraint)
- AccountingEntryFactory (builds GL DTOs from invoice paid, deposit posted, etc.)
- Event Outbox (written in same transaction as financial write)
- Stripe + ACH integration scaffolding
- Idempotent webhook handlers
- JournalEntryService (create draft → validate balance → post → reverse)
- OutboxProcessor + dead-letter handling (5 retry limit)

**What is NOT built yet:** Reconciliation, reporting snapshots, full payment rails, StanAI.

**Risks:** GL entry without balance validation posts corrupted data. Outbox outside transaction = silent notification gaps. BankBalanceProjector multi-writer = race conditions.

**Lock before Phase 3:** Every GL entry balances. Outbox written atomically. Book balance single-writer confirmed. Idempotency keys on all payment paths.

---

## Phase 3 · Core Data Model — Owners, Units, Residents (Weeks 5–7, partial parallel with Phase 2)

**Goal:** Homeowner data model complete. AR billing can target real unit/owner records.

**What is built:**
- Units model (belongs to Association)
- Owners / Residents model (with move-in/move-out versioning)
- Owner-Unit assignment history
- AR billing linkage to owners
- Homeowner accounts (balance tracking)

**What is NOT built yet:** Violations, ARC, work orders.

**Dependency:** Can begin parallel to Phase 2 backend work since it doesn't touch GL directly.

---

## Phase 4 · Community Operations (Weeks 7–10)

**Goal:** Violations, ARC/ARB, Work Orders operational.

**What is built:**
- Violations module (fines post to GL via journal entries)
- Compliance tracking
- ARC/ARB workflow + document attachments
- Work Orders + Vendor assignment
- Maintenance request lifecycle

**Risks:** Fine posting must go through JournalEntryService — direct DB inserts here are a defect.

---

## Phase 5 · Communications + Notifications + Documents (Weeks 9–11)

**What is built:**
- Outbox-driven email + SMS notifications
- Document management (Azure Blob/S3)
- Contract and financial record storage
- COI/W9 uploads linked to vendor records
- Notification read/unread tracking

---

## Phase 6 · Reporting + Dashboards + Admin Tools (Weeks 10–13)

**What is built:**
- Trial balance (read replica)
- Balance sheet, income statement
- GL history
- Bank register report
- Reconciliation reports
- LedgerPeriodSnapshots for closed periods
- GL account yearly rollup
- Board dashboard (read-only, snapshot-served)
- Manager dashboard
- ReportSnapshotService
- Admin / Global Settings module
- Fiscal year configuration

**Enforcements:** Closed-period reports NEVER from live ledger. Always from snapshots. All report queries hit read replica only.

---

## Phase 7 · Integrations Layer (Weeks 12–15)

**What is built:**
- Vantaca bidirectional sync
- Banking API integrations (Stripe, ACH, Lockbox)
- Webhook ingestion with idempotency
- External event validation before GL posting
- Integration health monitoring

---

## Phase 8 · AI + Automation (StanAI) (Weeks 15+)

**What is built:**
- AI-assisted transaction categorization (read-only GL access)
- Anomaly detection on reconciliation
- Report summarization for board packages
- Vendor compliance monitoring alerts
- StanAI action suggestions → routed through standard VeraAction classes (NEVER direct writes)

---

# SECTION 3 — TEAM STRUCTURE

## Roles

### Backend Engineering Lead (Financial Gatekeeper)
- **Owns:** VeraAction pattern enforcement, RLS implementation, GL correctness, money handling, audit log integrity, service layer architecture
- **Responsibilities:** Reviews every PR touching financial tables. Blocks any float money, direct model write, or SET (non-LOCAL) usage. Owns migration approval. Is the final word on financial data integrity.
- **Success looks like:** Zero floating-point money. Zero tenant leakage. Every write has an audit record. All tests green.

### Frontend Lead
- **Owns:** Next.js/TypeScript application. API integration layer. DTO-to-UI mapping. Role-based UI rendering.
- **Responsibilities:** Cannot begin building financial screens until Phase 1 backend is locked. Can build auth flow, navigation shell, and mock-data screens in parallel.
- **Success looks like:** All monetary values displayed from API cents (never computed in frontend). Role-gated UI matches RBAC model exactly.

### DevOps / Infrastructure
- **Owns:** Docker environment, CI/CD, PostgreSQL schema management, Redis, RLS deployment, read replica, Azure Blob/S3, monitoring (Datadog/CloudWatch), PagerDuty alerts.
- **Responsibilities:** Ensures `vera_core` schema exists before any migration runs. Manages connection pooling (PgBouncer if used — must use SET LOCAL, not SET). Owns deployment pipeline gating.
- **Success looks like:** Migrations run cleanly in CI. RLS deployed and tested in staging. Read replica routing confirmed. Zero schema drift between environments.

### QA / SDET
- **Owns:** Tenant isolation test suite. Financial correctness tests. API contract validation. Regression suite.
- **Responsibilities:** Writes and maintains isolation tests. Validates that cross-tenant reads return zero rows. Validates period state machine. Validates no float math reaches the database.
- **Success looks like:** Isolation tests are automated and run on every PR. Any RLS gap is caught in CI, not production.

### Product / Program Manager (Amanda / CTG)
- **Owns:** Phase gates. Sprint planning. Risk register. Stakeholder communication. Definition of Done enforcement.
- **Responsibilities:** Ensures no team begins a phase before prior phase is locked. Maintains module dependency map. Runs weekly reviews. Escalates blocking risks.
- **Success looks like:** Phase 1 shipped to spec with no forward-phase leakage. Engineering contract v4.3 is honored in every sprint.

---

## Phase Ownership Matrix

| Phase | Backend Lead | Frontend Lead | DevOps | QA | PM |
|-------|-------------|--------------|--------|----|----|
| 0 - Infra | Advises | Advises | **OWNS** | Validates | Gates |
| 1 - Foundation | **OWNS** | Shell only | Supports | **Co-owns** | Gates |
| 2 - Payments/AP | **OWNS** | Mock screens | Supports | **Co-owns** | Gates |
| 3 - Data Model | **OWNS** | Parallel build | — | Validates | Tracks |
| 4 - Community Ops | Leads | **Builds** | — | Validates | Gates |
| 5 - Comms/Docs | Leads | **Builds** | Supports | Validates | Tracks |
| 6 - Reporting | Leads | **Builds** | Replica routing | Validates | Gates |
| 7 - Integrations | **OWNS** | — | **Co-owns** | Validates | Gates |
| 8 - StanAI | Leads | **Builds UI** | Supports | Validates | Gates |

---

# SECTION 4 — CRITICAL PATH ANALYSIS

## What breaks EVERYTHING if done wrong

1. **RLS without NULL/empty session guard** — Pooled connections with no session set return ALL rows. This is a tenant data breach. One test in CI must verify this explicitly: query with no session context, expect zero rows.

2. **SET instead of SET LOCAL** — PgBouncer or any connection pool will carry tenant context across requests. Tenant A sees Tenant B's data. This is irreversible in production without a full connection pool flush.

3. **Float money at any layer** — PHP floats, JavaScript number, or PostgreSQL FLOAT types will introduce cents-level drift. After millions of transactions, financial statements are wrong by real dollars. Use BIGINT always, everywhere.

4. **Business logic in controllers** — If a controller validates a period transition instead of `FinancialPeriodService`, that logic will never be enforced in async jobs, CLI commands, or future API versions. Everything must go through the service layer.

5. **GL entry writes outside JournalEntryService** — Any module that directly inserts GL entries bypasses balance validation. One unbalanced entry corrupts the ledger. The service must be the only writer.

## What must NEVER be refactored later

- The `vera_core` PostgreSQL schema name
- The RLS policy pattern (NULL guard)
- Money storage as integer minor units
- The VeraAction write pattern
- Audit log append-only structure
- Financial period state machine transitions
- UUID application-layer generation strategy

Changing any of these after financial data exists requires a migration that touches every financial record. That is a compliance event.

## What MUST be completed before frontend begins financial screens

- Phase 1 fully locked (all tests pass, RLS deployed, audit logs synchronous)
- API contract stable (OpenAPI spec frozen for Phase 1 endpoints)
- Auth flow (Entra ID JWT validation) working end-to-end
- RBAC middleware enforcing policies

Frontend CAN begin in parallel: auth screens, navigation shell, mock-data dashboards, component library.

## What can be mocked vs fully built

| Item | Mock OK? | Notes |
|------|----------|-------|
| Entra ID in dev | Yes | Token bridge in dev environment |
| Outbox processor | Yes (Phase 1) | Log-only in Phase 1, real in Phase 2 |
| Email/SMS delivery | Yes | Mailpit in dev |
| Read replica | Yes (Phase 1) | Primary only until Phase 6 |
| Stripe/ACH | Yes (Phase 2 scaffold) | Webhooks can be simulated |
| StanAI | Yes | Stub responses until Phase 8 |
| RLS | **NEVER** | Must be real from day one |
| Money math | **NEVER** | No float approximations anywhere |
| Audit logs | **NEVER** | Must be real and synchronous from Phase 1 |

---

# SECTION 5 — ENFORCEMENT VALIDATION (v4.3 CONTRACT)

## Contract Checklist

| Rule | Status | Gap / Risk |
|------|--------|------------|
| No direct model writes (VeraAction only) | ✅ Defined | Risk: developers will shortcut this under deadline pressure. Requires PR review enforcement + linter rule if possible. |
| No business logic in controllers | ✅ Defined | Risk: same as above. Phase 1 controllers must be thin wrappers. Code review gate required. |
| BIGINT for all money | ✅ Defined | Risk: OpenAPI spec shows `integer` type for amount — confirm PostgreSQL column is BIGINT not INT. |
| DTO-only outputs from Actions | ✅ Defined | Risk: Eloquent model returned directly leaks internal fields. DTOs must be enforced at service boundary. |
| RLS default deny | ✅ Defined | ⚠️ **GAP**: NULL session guard must be explicitly tested. A missing `IS NOT NULL` check means no-context queries return data. |
| SET LOCAL (never SET) | ✅ Defined | ⚠️ **GAP**: If PgBouncer is ever introduced, this must be re-validated. Document this constraint prominently. |
| Audit logs atomic + immutable | ✅ Defined | ⚠️ **NOTE**: v4.3 mandates synchronous audit logs. Phase 1 plan mentions async queue (`AUDIT_LOG_QUEUE`). **RESOLVE: Phase 1 audit logs are synchronous. The queue config is for future async replication only. This must be documented explicitly or developers will queue Phase 1 audit writes.** |
| UUIDs at application layer | ✅ Defined | Risk: Laravel migrations may default to `uuid()` DB function. Must use `Str::uuid()` in VeraAction before insert. |
| `vera_core` schema (not public) | ✅ Defined | ⚠️ **GAP**: docker-compose.yml does not create `vera_core` schema. DevOps must add schema creation to migration bootstrap. |
| Two-tenant seeder | ✅ Defined | Required for isolation validation — must include associations with identical names across tenants. |
| Money in smallest unit on wire | ✅ Defined | OpenAPI schema shows `"amount": 1000` for $10.00. Must be validated in request validation layer. |

## Flags

🚨 **FLAG 1 — Audit Log Queue Ambiguity**
`AUDIT_LOG_QUEUE=default` is set in docker-compose.yml. v4.3 mandates synchronous audit logs in Phase 1. These appear to conflict. Resolution: Phase 1 audit logs write synchronously within the transaction. The queue variable is scaffolding for future async replication only. This must be stated explicitly in the developer onboarding doc.

🚨 **FLAG 2 — vera_core Schema Not in Docker Init**
No `CREATE SCHEMA vera_core` step exists in docker-compose or migration bootstrap. This will cause migrations to land in `public` schema by default. DevOps must add schema creation to the app startup command.

🚨 **FLAG 3 — GL Entry Balance Validation Not Yet Enforced (Phase 2)**
In Phase 2, JournalEntryService must reject any entry where `SUM(debits) != SUM(credits)`. This check must be in the service, not the controller, and must run before any database write. A database-level CHECK constraint is also recommended as a backstop.

---

# SECTION 6 — DEPENDENCY & BUILD ORDER MAP

```
[Infra / DevOps]
    └── PostgreSQL vera_core schema
    └── Redis
    └── Docker Compose
    └── CI Pipeline
         │
         ▼
[Phase 1 — Foundation] ← NOTHING else can start until this is locked
    ├── Tenant + Association Structure
    ├── RLS (NULL-guarded)
    ├── Middleware (ResolveTenantContext)
    ├── RBAC / Policies
    ├── VeraAction Pattern
    ├── Audit Log (synchronous)
    ├── Financial Period Lifecycle
    └── GL Groups + GL Accounts
         │
         ├──────────────────────────────┐
         ▼                              ▼
[Phase 2 — Payments/AP/Banking]   [Phase 3 — Owners/Units]
    ├── GL Entries                 (can run in parallel with Phase 2)
    ├── JournalEntryService
    ├── Bank Accounts
    ├── BankBalanceProjector
    ├── Vendors + Compliance
    ├── Invoices + Approvals
    ├── Payments
    └── Event Outbox
         │
         ├────────────────────────┐
         ▼                        ▼
[Phase 4 — Community Ops]   [Phase 5 — Comms/Docs]
    ├── Violations               ├── Email/SMS
    ├── ARC/ARB                  ├── Document Storage
    └── Work Orders              └── Notifications
         │
         ▼
[Phase 6 — Reporting + Admin]
    ├── Snapshots
    ├── Read Replica Routing
    ├── Dashboards
    └── Admin Settings
         │
         ▼
[Phase 7 — Integrations]
    ├── Vantaca Sync
    ├── Stripe/ACH
    └── Webhook Infrastructure
         │
         ▼
[Phase 8 — StanAI]
    └── Read-only AI layer over all modules
```

## Parallel Work Opportunities
- Phase 3 (Owners/Units) can begin during Phase 2 backend work
- Frontend shell, auth screens, and component library can build during Phase 1
- QA test infrastructure can build during Phase 0/1
- DevOps read replica setup can begin during Phase 2

## Bottlenecks
1. Phase 1 is a hard sequential gate — everything waits for it
2. JournalEntryService (Phase 2) gates AP, Banking, Reconciliation, and Reporting
3. Outbox pattern (Phase 2) gates all event-driven notifications
4. Snapshots (Phase 6) gate all closed-period reports

---

# SECTION 7 — EXECUTIVE SUMMARY (CEO LEVEL)

## What We Are Building First

We are building the financial engine that everything else depends on. Before we build a single feature for homeowners, board members, or community managers, we are building the system that will ensure every dollar is tracked correctly, every action is audited, and no tenant can ever see another tenant's data.

This is not optional sequencing. This is the only correct order.

## Why Financial Core Is First

A payment feature built on a broken accounting foundation produces wrong balances. A reporting dashboard built on float math shows wrong numbers to HOA boards. A multi-tenant system without proper isolation exposes one client's financial data to another. Any of these is not a bug — it is a liability.

We build the foundation correctly once, and every feature we add later is trustworthy because the foundation is trustworthy.

## 30-Day Success

- Development environment runs cleanly for all engineers
- Phase 1 is complete: tenant isolation, financial period lifecycle, GL foundation, audit logs
- All Phase 1 tests passing, including cross-tenant isolation tests
- No floating-point money anywhere in the codebase
- Engineering Contract v4.3 enforced in CI/PR review

## 60-Day Success

- Phase 2 underway: GL entries posting correctly (balanced, immutable, period-validated)
- Bank accounts mapped to GL cash accounts
- Vendor records with compliance tracking
- Invoice approval workflow functional
- First real payment processed through the system with a corresponding GL entry
- Event outbox writing atomically with financial transactions

## 90-Day Success

- Full accounting cycle operational: invoice → approval → payment → GL entry → bank register
- Community operations (violations, ARC, work orders) functional
- First financial reports available (trial balance, bank register)
- Integration with at least one external banking API
- Board-facing dashboard showing real financial data from snapshots

## Biggest Risks

1. **Developer shortcuts under deadline pressure** — someone will try to write directly to a model, use a float, or skip the audit log. Code review and PR gating must catch this.
2. **RLS misconfiguration** — one missing NULL guard exposes all tenant data. This must be tested on every deployment.
3. **Audit log timing confusion** — the queue config in docker-compose may mislead developers into queuing Phase 1 audit logs. Must be explicitly resolved in documentation.
4. **Schema placement** — missing `vera_core` schema creation means migrations land in `public`. Must be in bootstrap.
5. **Scope creep** — someone will want to "just quickly add" a Phase 2 feature in Phase 1. The PM must enforce phase gates without exception.

---

# SECTION 8 — EXECUTION SYSTEM: HOW AMANDA (CTG) RUNS THIS WEEKLY

## The Weekly Operating Model

### Monday — Sprint Planning (60 min)
- Review phase gate status: is Phase N complete? What is the evidence?
- Assign sprint work only from the current phase scope
- Any request to add Phase N+1 work is logged in backlog, not added to sprint
- Confirm: does every ticket this sprint have a clear Definition of Done?

### Tuesday–Thursday — Engineering Execution
- Backend Lead reviews every PR touching financial tables — no exceptions
- Block any PR that: uses float money, writes directly to model, uses SET instead of SET LOCAL, skips audit log
- QA runs isolation test suite on any merge to main
- DevOps validates schema and RLS deployment in staging on every release

### Friday — Sprint Review (45 min)
Amanda reviews with leads:

**What must be reviewed:**
- Are all tests passing, including isolation tests?
- Did any PR get merged without Backend Lead approval on financial tables?
- Are there any open flags from the enforcement checklist?
- Did any Phase N+1 feature land in this sprint?

**What must be blocked:**
- Any forward-phase work
- Any PR with float money
- Any PR with direct model write
- Any migration to `public` schema instead of `vera_core`
- Any audit log that is not synchronous in Phase 1

**What should move forward:**
- Work that is within the current phase scope
- Work that has passing tests
- Work that has Backend Lead approval on financial components

**What to measure (KPIs):**

| KPI | Target | Red Line |
|-----|--------|----------|
| Tenant isolation tests | 100% pass | Any failure = stop sprint |
| Float money instances | 0 | Any instance = blocking defect |
| Direct model writes | 0 | Any instance = blocking defect |
| Audit log coverage | 100% of write actions | Any gap = blocking defect |
| Phase gate compliance | 0 forward-phase features | Any violation = rollback |
| PR review coverage (financial) | 100% Backend Lead reviewed | Any miss = process failure |
| Migration schema | 100% in vera_core | Any public schema migration = rollback |

## The Escalation Rule

If any of the red lines above are breached in production, the response is:
1. Halt new feature work
2. Assess scope of data integrity impact
3. Fix + re-test before any new work resumes

There is no "we'll fix it later" for financial integrity. In a fintech system handling real money for real HOA communities, "fix it later" is a liability event.

---

*Blueprint Version: 1.0 | Derived from Vera Engineering Contract v4.3 FINAL + vera-financial-core.yaml v2.1.0*
*Prepared for: Amanda / CTG + Vera Engineering Team*
