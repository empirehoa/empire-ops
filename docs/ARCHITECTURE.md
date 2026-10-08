# Empire Ops architecture

Standalone internal tool for Riance LLC. **No dependency on Vera** (code, database, or auth).

## Data flow
Sources → empire-ops Supabase (own project) → agents + dashboards.

| Source | How it arrives | Tables |
|---|---|---|
| HubSpot | Private app token (`HUBSPOT_ACCESS_TOKEN`), daily sync | `crm_deals` |
| QuickBooks Online | OAuth 2.0 per company file, daily sync of P&L, balance sheet, AR aging | `oauth_connections`, `financial_reports` |
| Vantaca | Admin uploads CMP/IQ exports (xlsx/csv) with a column-mapping step | `communities`, `ar_aging_snapshots`, `action_items` |

Schema: `supabase/migrations/0001_empire_ops_schema.sql`. Types: `src/lib/types/database.ts` (hand-written, must match the migration).
Single organization: there is **no tenant_id**. RLS is on with no policies; all DB access is server-side via `createAdminClient()` (`src/lib/supabase/admin.ts`).

## Auth
- Admin pages (server components): `await requireAdminPage()` from `@/lib/auth/admin`.
- Admin API routes: `const admin = await requireAdminApi(); if (admin instanceof NextResponse) return admin`.
- Scheduled endpoints (`/api/automation/*`, `/api/sync/*`): `verifyAutomationSecret(request)` from `@/lib/auth/automation-secret`.
- Allowlist: `ADMIN_EMAILS` (comma-separated). Sign-in is a Supabase magic link.

## Run records
Every sync/import records a `sync_runs` row; every agent run records an `agent_runs` row. Helpers in `src/lib/runs.ts`.
Dashboards show "data as of" from `latestSyncs()` so stale data is never presented as current.

## Module contracts
- `src/lib/integrations/hubspot/sync.ts` exports `syncHubSpotDeals(db: AdminClient): Promise<{ rows: number }>`.
- `src/lib/integrations/quickbooks/sync.ts` exports `syncAllQuickBooks(db: AdminClient): Promise<{ companies: number; reports: number; skipped: string[] }>` (companies without a connection are skipped, not errors).
- Daily schedule (`/api/cron/run-all`): run syncs first, then agents.

## Data rules
- Money in the DB is dollars (numeric), not cents.
- Vantaca dummy-data gate: every portfolio figure filters `communities.is_test = false`.
- Never fabricate figures. If a source isn't connected, say so in the UI/report instead of showing placeholders.
- Each association is a separate client; never blend one association's records into another's context.
