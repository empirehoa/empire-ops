# Vera Platform Architecture

## Overview

Vera is a multi-tenant HOA management SaaS platform built by Empire Management Group (255 communities, 28,391 doors).

**Current Stack**: Next.js 14 (App Router) · TypeScript · Tailwind v4 · Supabase (PostgreSQL + Auth + Storage) · Claude AI  
**Target Infrastructure**: Microsoft Azure (App Service, PostgreSQL Flexible Server, Key Vault, Storage, Redis, Service Bus)  
**AI Layer**: StanAI — powered by Claude (Anthropic), read-only over financial data

---

## Module Registry (M-01 → M-19)

From `vera-blueprint.md` (Engineering Contract v4.3 FINAL):

| Module | Name | Priority | Risk | Status |
|--------|------|----------|------|--------|
| M-01 | Financial Core (GL, Ledger, Journal Entries, Periods) | 1 | 🔴 HIGH | ✅ Built |
| M-02 | Payments (Stripe, ACH, Lockbox) | 4 | 🔴 HIGH | 🟡 Partial |
| M-03 | AR / AP Automation | 4 | 🔴 HIGH | ✅ Built |
| M-04 | Associations / Multi-Tenant Structure | 1 | 🔴 HIGH | ✅ Built |
| M-05 | Owners / Residents / Units | 3 | 🟡 MEDIUM | ✅ Built |
| M-06 | Violations / Compliance | 5 | 🟡 MEDIUM | ✅ Built |
| M-07 | ARC / ARB (Architectural Review) | 6 | 🟢 LOW | ✅ Built |
| M-08 | Banking (Bank Accounts, Register, Deposits, Transfers) | 4 | 🔴 HIGH | ✅ Built |
| M-09 | Reconciliation | 5 | 🔴 HIGH | ✅ Built |
| M-10 | Reporting / Dashboards | 6 | 🟡 MEDIUM | 🟡 Partial |
| M-11 | Work Orders / Maintenance | 6 | 🟢 LOW | ✅ Built |
| M-12 | Vendor Management | 4 | 🟡 MEDIUM | ✅ Built |
| M-13 | Communications (Email + SMS) | 6 | 🟢 LOW | 🟡 Partial |
| M-14 | Document Management | 5 | 🟡 MEDIUM | 🟡 Partial |
| M-15 | Notifications + Event Outbox | 4 | 🔴 HIGH | 🔴 Gap |
| M-16 | Integration Layer (Vantaca, Banking APIs) | 7 | 🔴 HIGH | 🟡 Partial |
| M-17 | RBAC / Permissions | 1 | 🔴 HIGH | 🟡 Partial (dual system) |
| M-18 | Admin / Global Settings | 5 | 🟡 MEDIUM | ✅ Built |
| M-19 | AI / Automation (StanAI) | 8 | 🟡 MEDIUM | ✅ Built (2026-04-03) |

---

## Critical Architectural Principles

> "We are not building features. We are building a financial system that features depend on."
> — Vera Engineering Contract v4.3

### Financial Integrity Rules (NEVER violate)
1. **BIGINT for all money** — no floats, no JavaScript `number` for currency math
2. **Double-entry GL only** — every financial transaction produces balanced journal entries
3. **Immutable posted entries** — GL entries cannot be edited after posting; only reversed
4. **RLS NULL guard** — `get_tenant_id()` returns NULL with no context → zero rows
5. **Audit logs are synchronous** — written in the same transaction as the financial write
6. **SET LOCAL, never SET** — connection pool must not leak tenant context

### Multi-Tenancy Architecture
- **Tenant isolation**: Every table has `tenant_id` column; all queries scoped via RLS
- **RLS function**: `public.get_tenant_id()` reads from JWT claims → user_profiles fallback
- **Null guard**: Returns NULL (not error) when no context set → zero rows returned
- **No bypass**: RLS applies to table owner via `FORCE ROW LEVEL SECURITY`

---

## Database Architecture

### Current: Supabase PostgreSQL (public schema)
- 103 migrations in `supabase/migrations/`
- RLS on all tables via `public.get_tenant_id()`
- Session variable: `request.jwt.claims.tenant_id`

### Target: Azure PostgreSQL Flexible Server
- CTO designed `vera_core` schema pattern (see `docs/db/`)
- Uses `SET LOCAL app.current_organization_id` pattern
- RLS pattern: `NULLIF(current_setting('app.current_organization_id', true), '')::uuid`
- Migration path: document in `docs/db/migration-to-azure.md`

---

## AI Layer (StanAI — M-19)

**Implementation**: `src/lib/ai/stanai.ts`  
**Backend**: Claude (claude-sonnet-4-6 / claude-haiku-4-5-20251001)  
**Principle**: Read-only access only. All AI-suggested actions require human approval before any write.

Capabilities:
1. **GL Categorization** — Suggests account codes for uncategorized transactions
2. **Anomaly Detection** — Flags reconciliation inconsistencies and unusual patterns
3. **Board Package Summaries** — Generates executive summaries for board meeting packages
4. **Vendor Compliance Monitoring** — Surfaces COI expiration, TIN issues, holds

---

## Infrastructure

See `infra/azure-production.bicep` for the full Azure resource definition.

Key resources:
- **App Service**: Next.js application (linux/node:20-lts)
- **PostgreSQL Flexible Server**: PG 16, HA in production
- **Key Vault**: All secrets (Anthropic, Stripe, Supabase keys)
- **Storage Account**: Private blobs — use signed URLs, never `getPublicUrl`
- **Redis Cache**: Rate limiting, session, workflow state
- **Service Bus**: Event outbox delivery (async notification fanout)
- **Application Insights**: Monitoring and tracing

---

## Security Notes

- **Stripe key**: sk_live_51T8Wos... was exposed in git history → ROTATE NOW at dashboard.stripe.com
- **Private storage**: All document/inspection buckets have `allowBlobPublicAccess: false`
- **Key Vault**: App Service uses managed identity → Key Vault Secrets User role
- **message_attachments**: RLS fixed (migration 103) — was `USING (true)` → now tenant-scoped
- **payment_batch_items**: RLS added (migration 103) — had no RLS

---

## Document Index

| File | Description |
|------|-------------|
| `docs/db/000_create_vera_core_schema.sql` | CTO: vera_core schema bootstrap |
| `docs/db/001_create_access_control_tables.sql` | CTO: access control tables |
| `docs/db/002_enable_rls.sql` | CTO: RLS with NULL-guard policies |
| `docs/api/vera_openapi_v1.yaml` | CTO: OpenAPI 3.1 contract for Laravel backend |
| `docs/sprints/README.md` | CTO: Sprint 1-2 developer handoff |
| `docs/architecture/vera-blueprint.md` | CTO: Full 19-module execution blueprint |
| `infra/azure-production.bicep` | Azure production infrastructure |
| `.github/workflows/deploy-azure.yml` | Azure deployment pipeline |
| `src/lib/ai/stanai.ts` | StanAI implementation (M-19) |
