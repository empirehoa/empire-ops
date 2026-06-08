# Vera Codebase Knowledge Graph
Generated: 2026-04-14

## Summary Statistics

| Metric | Count |
|---|---|
| Total TypeScript/TSX files | 2,163 |
| Page routes (page.tsx) | 537 |
| API routes (route.ts) | 411 |
| Layout files | 19 |
| Component directories | 89 |
| UI primitives (shadcn) | 47 |
| Query modules | 86 |
| Action modules | 96 |
| Service modules | 103 |
| Database migrations | 135 |
| Internal import edges | 6,448 |
| Unique import relationships | 1,988 |

---

## God Nodes (Most Connected Files)

These files are imported by the most other files in the codebase. Changes here have the widest blast radius.

| Rank | File | Import Count | Purpose |
|---|---|---|---|
| 1 | `src/lib/supabase/server.ts` | 903 | Server-side Supabase client factory (`createClient()`) -- used by virtually every server component and API route |
| 2 | `src/components/ui/button.tsx` | 682 | shadcn/ui Button component -- the most-used UI primitive |
| 3 | `src/components/ui/badge.tsx` | 405 | Status badges (active/inactive, paid/unpaid, etc.) |
| 4 | `src/lib/utils.ts` | 313 | `cn()` class-merge utility (clsx + tailwind-merge) |
| 5 | `src/components/ui/card.tsx` | 312 | Card container component |
| 6 | `src/lib/utils/format.ts` | 289 | `formatCurrency()`, `formatDate()`, `isNegativeAmount()` -- accounting-style formatters |
| 7 | `src/components/ui/input.tsx` | 222 | Text input component |
| 8 | `src/components/ui/label.tsx` | 214 | Form label component |
| 9 | `src/components/ui/select.tsx` | 165 | Dropdown select component |
| 10 | `src/components/ui/table.tsx` | 147 | Data table component |
| 11 | `src/components/ui/textarea.tsx` | 125 | Textarea component |
| 12 | `src/lib/auth/rbac.ts` | 84 | Role-based access control (`getAuthContext()`, `hasPermission()`, `AuthContext` type) |
| 13 | `src/components/ui/dialog.tsx` | 77 | Modal dialog component |
| 14 | `src/lib/queries/associations.ts` | 62 | Core domain queries: `getAssociations()`, `getAssociation()`, community data |
| 15 | `src/components/ui/page-skeleton.tsx` | 51 | Loading skeleton for full pages |
| 16 | `src/lib/validation.ts` | 49 | Shared validation utilities |
| 17 | `src/lib/validation/schemas.ts` | 44 | Zod schemas for form/API validation |
| 18 | `src/lib/types/database.ts` | 41 | Supabase-generated database types (19,372 lines) |
| 19 | `src/components/ui/error-fallback.tsx` | 41 | Error boundary fallback UI |
| 20 | `src/lib/queries/financials.ts` | 37 | Financial data queries (assessments, ledgers, AR/AP) |

### God Node Tiers

**Tier 1 -- Universal (500+ imports):** `supabase/server`, `ui/button`
These are foundational. Almost every file depends on them.

**Tier 2 -- Pervasive (200-500 imports):** `ui/badge`, `utils`, `ui/card`, `utils/format`, `ui/input`, `ui/label`
Core UI primitives and formatting utilities used across all feature domains.

**Tier 3 -- Structural (50-200 imports):** `ui/select`, `ui/table`, `ui/textarea`, `auth/rbac`, `ui/dialog`, `queries/associations`, `ui/page-skeleton`
Feature-level building blocks and key domain queries.

---

## Community Structure

The codebase organizes into distinct functional clusters. Files within a community are tightly coupled; connections between communities flow through the God Nodes above.

### 1. Core Infrastructure
**Purpose:** Database access, auth, configuration, types
**Key files:**
- `src/lib/supabase/server.ts` -- Server Supabase client
- `src/lib/supabase/client.ts` -- Browser Supabase client (18 imports)
- `src/lib/supabase/auth-context.ts` -- Tenant-scoped auth context
- `src/lib/supabase/middleware.ts` -- Session refresh middleware
- `src/lib/supabase/env.ts` -- Environment variable access
- `src/lib/types/database.ts` -- Generated DB types (19K lines)
- `src/lib/auth/rbac.ts` -- Permission matrix and role checks
- `src/lib/auth/permissions.ts` -- Pure permission logic (17 imports)
- `src/lib/auth/automation-secret.ts` -- Cron job auth (18 imports)
- `src/lib/api/response.ts` -- Standardized API response helpers (34 imports)
- `src/middleware.ts` -- Next.js request middleware (session refresh)

### 2. UI Primitives (shadcn/ui)
**Purpose:** 47 reusable Radix-based components
**Directory:** `src/components/ui/`
**Top components:** button (682), badge (405), card (312), input (222), label (214), select (165), table (147), textarea (125), dialog (77), page-skeleton (51), error-fallback (41)
**Pattern:** All are client components, imported by feature components across every domain.

### 3. Association Management (Largest Domain)
**Purpose:** Community/HOA CRUD, unit management, owner records
**Routes:** `src/app/(dashboard)/associations/` (344 files) -- the single largest route group
**Subroutes per association:** access-control, action-items, activities, amenities, arc, ballots, billing, calendar, certificates, communications, compliance, deliverables, development, documents, elections, financials, golf, inbox, inspections, insurance, inventory, letters, lots, maintenance, map, marina, meetings, messaging, onboarding, owners, ownership-transfers, pool-reports, pos, properties, property-appraiser, reports, settings, sirs, surveys, utilities, vehicles, vendor-contracts, violations, work-orders
**Key queries:** `src/lib/queries/associations.ts` (62 imports), `src/lib/queries/properties.ts` (16)

### 4. Financial System
**Purpose:** AP/AR, assessments, billing, collections, bank reconciliation, reporting
**Components:** `src/components/financials/` (104 files -- largest component group)
**Services:** `src/lib/services/financial-reports.ts` (36 imports), `src/lib/services/excel-export.ts` (27), `src/lib/services/accounting/` (12 files)
**Queries:** `src/lib/queries/financials.ts` (37), `src/lib/queries/ap.ts` (14), `src/lib/queries/bank.ts` (14), `src/lib/queries/budgets.ts` (8), `src/lib/queries/assessments.ts` (8)
**Reports sub-components:** `report-header` (35), `report-date-picker` (34), `pdf-export-button` (19)
**Routes:** `src/app/(dashboard)/associations/[associationId]/financials/`, `src/app/api/accounting/` (60 files)

### 5. Compliance & Violations
**Purpose:** Florida HOA statute compliance, violation lifecycle, statutory timelines
**Services:** `src/lib/services/compliance/statutory-engine.ts` (12 imports), `src/lib/services/violation-engine.ts`, `src/lib/services/compliance-engine.ts`
**Components:** `src/components/compliance/` (11), `src/components/violations/` (8)
**Routes:** `src/app/(dashboard)/associations/[associationId]/compliance/`, `src/app/(dashboard)/associations/[associationId]/violations/`

### 6. Communications
**Purpose:** Email, SMS (Twilio), messaging, call center
**Services:** `src/lib/services/communications/` (10 files), types (14 imports)
**Components:** `src/components/communications/` (13), `src/components/messaging/`
**Queries:** `src/lib/queries/communications.ts` (9), `src/lib/queries/messaging.ts` (8), `src/lib/queries/call-center.ts` (9)
**Actions:** `src/lib/actions/messaging.ts` (9)

### 7. AI / VeRAI
**Purpose:** AI assistant, chatbot, Claude SDK integration
**Lib:** `src/lib/ai/client.ts` (16 imports), `src/lib/ai/verai.ts` (15)
**Services:** `src/lib/services/ai/` (7 files), `src/lib/services/ai-chatbot.ts`
**Components:** `src/components/ai/`, `src/components/verai/`, `src/components/chatbot/`
**Routes:** `src/app/(dashboard)/verai/` (21 files), `src/app/api/ai/` (25 files)

### 8. CRM & Sales
**Purpose:** Contact management, deals, pipelines, lead tracking
**Components:** `src/components/crm/` (11 files)
**Queries:** `src/lib/queries/crm.ts` (12)
**Routes:** `src/app/(dashboard)/crm/` (16 files), `src/app/api/crm/` (5 files)

### 9. Board & Governance
**Purpose:** Board meetings, elections, resolutions, education, document packets
**Components:** `src/components/board/` (10), `src/components/elections/` (7), `src/components/meetings/` (11)
**Queries:** `src/lib/queries/board.ts` (8), `src/lib/queries/elections.ts` (10), `src/lib/queries/meetings.ts`
**Services:** `src/lib/services/meeting-packets.ts`, `src/lib/services/board-portal-engine.ts`

### 10. Homeowner Portal
**Purpose:** Resident-facing app (balance, payments, violations, work orders, voting)
**Routes:** `src/app/portal/` (47 files) -- 37 subroutes
**Components:** `src/components/portal/` (7 files)
**Hooks:** `src/hooks/use-portal.tsx`

### 11. Integrations
**Purpose:** External system sync (Vantaca, QuickBooks, Paylocity, Twilio, Stripe, Plaid, PandaDoc, Azure AD)
**Lib:** `src/lib/integrations/` (24 files)
**Queries:** `src/lib/queries/integrations.ts`
**Actions:** `src/lib/actions/integrations.ts`, `src/lib/actions/qbo-sync.ts`
**Clients:** quickbooks/, paylocity/, twilio/, bankunited/, common-area/, insurance/, tenant-evaluation/, hoa-mailers/

### 12. Automation / Cron Jobs
**Purpose:** 7 daily automation jobs plus CRM intelligence
**Entry point:** `src/app/api/cron/run-all/route.ts`
**Individual jobs:** `src/app/api/automation/` (18 files)
  - `post-assessments/` -- Monthly billing
  - `apply-late-fees/` -- Fee application
  - `payment-plans/` -- Installment processing
  - `collection-escalation/` -- AR escalation
  - `escalate-violations/` -- FL statute timelines
  - `generate-meeting-packets/` -- Board packet prep
  - `generate-recurring-work-orders/` -- Maintenance scheduling
  - `deliver-managers-reports/` -- Report delivery
  - CRM automation: `cross-sell/`, `competitive-intel/`, `client-retention/`, `sales-intelligence/`, `financial-health/`

### 13. Payments (Stripe + Plaid)
**Purpose:** Payment processing, bank connections, ACH
**Lib:** `src/lib/stripe/client.ts` (11 imports), `src/lib/plaid/client.ts` (6)
**Components:** `src/components/payments/`
**Routes:** `src/app/api/webhooks/` (Stripe webhooks), `src/app/api/banking/`

### 14. Work Orders & Maintenance
**Purpose:** Work order lifecycle, recurring generation, vendor assignment
**Components:** `src/components/work-orders/` (10 files)
**Services:** `src/lib/services/work-order-engine.ts`, `src/lib/services/recurring-wo-engine.ts`
**Queries:** `src/lib/queries/work-orders.ts`

### 15. Admin & Settings
**Purpose:** System administration, user management, tenant config
**Routes:** `src/app/(dashboard)/admin/` (34 files), `src/app/(dashboard)/settings/` (50 files)
**Components:** `src/components/settings/` (8), `src/components/admin/`

---

## Entry Points

### To understand the overall app structure:
- `src/app/layout.tsx` -- Root layout (fonts, providers, theme)
- `src/app/(dashboard)/layout.tsx` -- Dashboard shell (auth gate, sidebar, header, tenant provider)
- `src/middleware.ts` -- Request middleware (session refresh)
- `next.config.ts` -- Build configuration

### To understand a specific domain:
| Domain | Start here | Then look at |
|---|---|---|
| Associations | `src/lib/queries/associations.ts` | `src/app/(dashboard)/associations/` |
| Financials | `src/lib/queries/financials.ts` | `src/components/financials/`, `src/lib/services/accounting/` |
| Auth & Tenancy | `src/lib/auth/rbac.ts` | `src/lib/supabase/auth-context.ts`, `src/hooks/use-tenant.tsx` |
| Violations | `src/lib/services/violation-engine.ts` | `src/lib/services/compliance/statutory-engine.ts` |
| Automation | `src/app/api/cron/run-all/route.ts` | `src/app/api/automation/*/route.ts` |
| Portal | `src/app/portal/layout.tsx` | `src/app/portal/*/page.tsx` |
| AI/VeRAI | `src/lib/ai/client.ts` | `src/lib/ai/verai.ts`, `src/app/api/ai/` |
| Integrations | `src/lib/integrations/index.ts` | Individual client dirs in `src/lib/integrations/` |
| Payments | `src/lib/stripe/client.ts` | `src/lib/plaid/client.ts`, `src/app/api/webhooks/` |
| Database | `src/lib/types/database.ts` | `supabase/migrations/` (135 migrations) |
| UI Components | `src/components/ui/button.tsx` | All 47 files in `src/components/ui/` |
| Validation | `src/lib/validation/schemas.ts` | `src/lib/validation.ts` |

### To understand data flow patterns:
1. **Server Component page** -> calls `createClient()` from `@/lib/supabase/server` -> calls query from `@/lib/queries/*` -> renders with `@/components/ui/*`
2. **API Route** -> validates with `@/lib/validation/schemas` -> calls `createClient()` -> mutates via `@/lib/actions/*` -> returns via `@/lib/api/response`
3. **Automation Job** -> `api/cron/run-all` -> individual `api/automation/*` routes -> services from `lib/services/*`

---

## Architecture Overview

Vera is a **multi-tenant SaaS platform** for Florida HOA management built on Next.js 16 (App Router) with Supabase (PostgreSQL + Auth + Storage + RLS).

### Key architectural patterns:

1. **Multi-tenant isolation**: Every Supabase query includes `.eq('tenant_id', tenantId)`. Row-Level Security (RLS) policies provide database-level enforcement. `src/lib/supabase/auth-context.ts` extracts tenant context from the authenticated session.

2. **Server-first rendering**: The vast majority of pages are Server Components that call `createClient()` directly. Only interactive components (charts, forms, dropdowns) are Client Components (`'use client'`).

3. **Query/Action separation**: Read operations live in `src/lib/queries/` (86 files). Write operations live in `src/lib/actions/` (96 files). Services in `src/lib/services/` (103 files) contain business logic.

4. **Route group organization**: `(dashboard)` for authenticated staff UI, `(auth)` for login/signup, `portal` for homeowner-facing app, `inspector` for field inspections, `guard` for gate access, `vendor-portal` for vendor self-service.

5. **Financial data**: All monetary values stored in cents (integers). `formatCurrency()` handles display. Accounting-style negative formatting: `($1,234.56)`.

6. **Automation**: 7+ cron jobs run daily via Vercel cron, orchestrated by `/api/cron/run-all`. Each job is an independent API route protected by `AUTOMATION_SECRET`. Failures post to Discord.

7. **Integrations**: External APIs (QuickBooks, Vantaca, Stripe, Plaid, Twilio, etc.) are wrapped in client classes under `src/lib/integrations/`. Sync operations run as background jobs.

### Scale:
- 537 page routes, 411 API routes
- 89 component directories with 578 component files
- 86 query modules, 96 action modules, 103 service files
- 135 database migrations
- 47 shadcn/ui primitives
- Manages 255 communities, 28,391 doors

---

## Navigation Guide

### Finding a feature:
1. **By URL**: Map the URL path to `src/app/(dashboard)/[path]/page.tsx`
2. **By domain**: Check `src/lib/queries/[domain].ts` for data access, `src/lib/actions/[domain].ts` for mutations
3. **By component**: Look in `src/components/[domain]/` for UI pieces

### Finding where something is used:
- Grep for `from '@/[path]'` to find all importers of a module
- The God Nodes table above shows the highest-impact files

### Common file patterns:
| Pattern | Location | Example |
|---|---|---|
| Page route | `src/app/(dashboard)/[domain]/page.tsx` | `associations/page.tsx` |
| Dynamic page | `src/app/(dashboard)/[domain]/[id]/page.tsx` | `associations/[associationId]/page.tsx` |
| API route | `src/app/api/[domain]/route.ts` | `api/associations/route.ts` |
| Query module | `src/lib/queries/[domain].ts` | `queries/associations.ts` |
| Action module | `src/lib/actions/[domain].ts` | `actions/associations.ts` |
| Service | `src/lib/services/[name].ts` | `services/assessment-engine.ts` |
| Component dir | `src/components/[domain]/` | `components/financials/` |
| Validation | `src/lib/validation/schemas.ts` | Zod schemas |

### Key directories at a glance:
```
src/
  app/
    (auth)/          -- Login, signup, password reset (5 routes)
    (dashboard)/     -- Staff dashboard (664 files, 344 in associations/)
      associations/  -- Per-community management (45 feature areas)
      admin/         -- System administration
      settings/      -- Tenant configuration
      accounting-only/ -- Standalone accounting views
      verai/         -- AI assistant interface
    api/             -- REST API (415 files)
      automation/    -- Cron jobs (18 files)
      accounting/    -- Financial API (60 files)
      associations/  -- Association API (82 files)
      ai/            -- AI endpoints (25 files)
    portal/          -- Homeowner self-service (47 files)
    inspector/       -- Field inspection app
    guard/           -- Gate access app
    vendor-portal/   -- Vendor self-service
  components/
    ui/              -- 47 shadcn/ui primitives
    financials/      -- 104 financial UI components
    layout/          -- Sidebar, header, navigation (12 files)
    [domain]/        -- Domain-specific components (89 dirs total)
  lib/
    supabase/        -- DB client, auth, middleware, types (7 files)
    auth/            -- RBAC, permissions, financial controls (11 files)
    queries/         -- Read-only data access (86 files)
    actions/         -- Write operations / mutations (96 files)
    services/        -- Business logic engines (103 files)
    integrations/    -- External API clients (24 files)
    validation/      -- Zod schemas and validators
    ai/              -- AI client and tools
    utils/           -- Formatting, constants, helpers
    types/           -- database.ts (19K lines of generated types)
  hooks/             -- React hooks (7 files)
supabase/
  migrations/        -- 135 SQL migration files
```
