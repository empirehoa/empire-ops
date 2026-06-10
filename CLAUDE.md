# Empire Ops — Riance LLC Intelligence & Automation Platform

## Project
Standalone intelligence system extracted from Vera (empirehoa/vera).
Next.js 16 + TypeScript + Supabase + Vercel

## Owner
JR Riestra — CEO, Riance LLC
- Empire Management Group: $7.71M, 63 employees, 255 communities, 28,391 doors
- Riance Realty: $2.4M, 12 employees
- Wind Fire & Water (WFW): $890K, 11 employees
- FixIQ: $340K, 4 employees
- Total: $11.34M revenue, 90 employees

## What This Repo Contains
Intelligence-only extraction — no HOA operations (those stay in Vera).

### Automation Agents (6)
Run daily via Vercel cron at 06:00 UTC (`/api/cron/run-all`):
- **Intelligence (5):** Sales, financial health, retention, cross-sell, competitive intel
- **Sync (1):** Notion daily sync

Core HOA operations agents (assessments, late fees, violations, meeting
packets, work orders) run in the Vera platform — not this repo.

### Executive Dashboards
- `/admin/executive` — Riance LLC portfolio (4 companies, KPIs, cross-sell, charts)
- `/admin/executive/growth` — Revenue concentration, pricing, AR aging, expansion markets

### Intelligence APIs
- `GET /api/admin/intelligence` — Portfolio metrics
- `GET /api/admin/intelligence/cross-sell` — Opportunity detection
- `GET /api/admin/intelligence/pricing` — Fee benchmarks
- `GET /api/admin/agent-status` — All 6 agents status
- `GET /api/admin/integration-health` — Integration sync status
- `POST /api/admin/sync-notion` — Manual Notion sync
- `POST /api/integrations/hubspot/sync` — HubSpot CRM sync

### Knowledge Base
- `docs/vault/` — 28-note Obsidian vault
- `graphify-out/` — Codebase knowledge graph

## Brand
Navy #1C244B | Blue #1C74AC | Coral #F98761

## Rules
- All Supabase queries MUST include `.eq('tenant_id', tenantId)`
- `npm run build` must pass before any PR
