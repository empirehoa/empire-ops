# ADR-004: Supabase as Current Database / Azure PostgreSQL as Phase 2 Target

**Status**: Accepted  
**Date**: 2026-04-03  
**Authors**: JR Riestra (CEO), Claude (AI Architect)

---

## Context

The CTO's specification targets Azure PostgreSQL Flexible Server as the production database. The Vera platform was built on Supabase. This ADR documents why Supabase is the correct database for Phase 1, what the migration path to Azure PostgreSQL looks like in Phase 2, and what the concrete changeset is when that migration occurs.

---

## Decision

**Supabase IS the database now.** Azure PostgreSQL Flexible Server is the Phase 2 migration target.

This is not a workaround or a compromise. It is an intentional, time-bounded decision with a defined exit path.

---

## Why Supabase in Phase 1

### 1. Supabase is managed PostgreSQL

Supabase runs PostgreSQL 15 under the hood. The CTO's SQL — including `vera_core` schema definitions, RLS policies, triggers, and functions — runs verbatim on Supabase with no modifications. There is no dialect difference, no ORM translation layer, and no schema incompatibility.

The 110 migrations in `supabase/migrations/` are standard PostgreSQL DDL. They can be replayed against Azure PostgreSQL Flexible Server without rewriting.

### 2. Operational velocity

Supabase provides managed auth, storage, real-time, and auto-generated REST API (PostgREST) without infrastructure configuration. Setting up equivalent services on Azure (Azure Database for PostgreSQL, Azure Blob Storage, Azure AD B2C, SignalR) requires 4-6 weeks of DevOps work before a single line of application code can run.

Phase 1 is about getting the platform functional for the 255 communities and 28,391 doors Empire Management Group manages. Supabase allows this without blocking on infrastructure.

### 3. The bridge pattern resolves the schema concern

ADR-002 documents how `vera_core` schema is implemented in Supabase via bridge views. The CTO's concern about PostgREST only exposing the `public` schema is resolved by the `v_vera_core_*` bridge views. The CTO's concern about RLS GUC patterns is resolved by `vera_core.current_organization_id()`. The bridge is explicitly designed to be removed in Phase 2.

---

## What Supabase Provides That Azure Must Replicate

When migrating to Azure PostgreSQL, the following Supabase-managed services require explicit Azure replacements:

| Supabase Service | Azure Replacement | Migration Complexity |
|-----------------|-------------------|---------------------|
| Supabase Auth (GoTrue) | Microsoft Entra ID External Identities | High — all user sessions invalidated |
| Supabase Storage | Azure Blob Storage | Medium — URL migration, SAS token pattern |
| PostgREST (auto REST API) | Laravel API or Azure API Management | High — replaces entire API layer |
| Supabase Realtime | Azure SignalR Service | Medium — event subscription pattern changes |
| Supabase Edge Functions | Azure Functions | Low — thin wrappers |
| Supabase Dashboard | Azure Portal + pgAdmin | None — tooling change only |

---

## What Changes in Phase 2

### Database

**Remove** from Supabase:
- `public.v_vera_core_organizations` (bridge view)
- `public.v_vera_core_associations` (bridge view)
- `public.management_organizations.tenant_id` bridge column
- `vera_core.associations.public_assoc_id` bridge column
- JWT fallback branch in `vera_core.current_organization_id()`

**Run on Azure PostgreSQL**:
- All 110 existing migrations (replay verbatim)
- CTO reference SQL from `docs/db/` (now becomes active migrations, not reference)
- `vera_core` schema runs natively — no bridge required

### API Layer

**Replace** Next.js API routes with Laravel API:
- `/api/v1/organizations` → Laravel `OrganizationController`
- `/api/v1/associations` → Laravel `AssociationController`
- `/api/v1/ai/stanai` → Laravel `StanAiController` with VeraAction gating

**PostgREST** is either:
- Removed entirely (Laravel owns all DB access)
- Retained as an internal service for read-only reporting queries (simpler)

### Connection Strings

```env
# Phase 1 (Supabase)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Phase 2 (Azure PostgreSQL)
DATABASE_URL=postgresql://[user]@[server-name]:[password]@[server-name].postgres.database.azure.com:5432/vera
AZURE_POSTGRESQL_HOST=[server-name].postgres.database.azure.com
AZURE_POSTGRESQL_SSL=require
```

The application code that constructs database connections uses environment variables exclusively. Swapping connection strings does not require application code changes.

### Authentication

**Replace** Supabase GoTrue with Microsoft Entra ID:
- All `auth.uid()` RLS references updated to use Entra object ID
- `vera_core.current_organization_id()` GUC path becomes the only path
- JWT fallback branch removed
- All existing Supabase Auth user records must be migrated to Entra (or users re-register)

This is the highest-risk Phase 2 change. It cannot be done incrementally.

---

## Migration Execution Plan (Phase 2)

**Prerequisites before starting Phase 2:**
- Laravel API is feature-complete and serving all endpoints that Next.js currently handles
- VeraAction is implemented and StanAI is gated (ADR-003)
- Azure PostgreSQL Flexible Server is provisioned and access-controlled
- Microsoft Entra ID tenant is configured with Vera application registration
- All 110 migrations have been dry-run against Azure PostgreSQL and verified

**Migration sequence:**
1. Provision Azure PostgreSQL; replay all migrations; verify schema integrity
2. Enable logical replication from Supabase to Azure PostgreSQL (catch-up period)
3. Cut DNS/connection strings to Azure PostgreSQL at zero-traffic window
4. Migrate Supabase Storage bucket contents to Azure Blob Storage
5. Cut auth from Supabase GoTrue to Entra ID (users re-authenticate)
6. Remove Supabase bridge views and bridge columns from Azure PostgreSQL
7. Run `vera_core` reference SQL from `docs/db/` as native migrations
8. Decommission Supabase project

**Rollback plan**: If Azure PostgreSQL migration fails, reverse DNS/connection strings to Supabase. Supabase remains live and current during the catch-up replication period, making rollback safe until the auth cutover. Post-auth-cutover rollback is destructive — users would need to re-authenticate against Supabase.

---

## What Does NOT Change in Phase 2

- Next.js frontend (unless CTO Angular migration is also in scope)
- Business logic in Livewire components or React server components
- The `vera_core` schema structure (same DDL, runs natively instead of via bridge)
- RLS policy logic (same policies, GUC path only instead of dual-path)
- All 110 migration files (replayed as-is, then archived)

---

## Related ADRs

- ADR-001: CTO Architecture Integration Strategy — Phase 2 framing
- ADR-002: vera_core Schema in Supabase via Bridge Pattern — bridge that Phase 2 removes

---

*Architecture Decision Records are living documents. Update this ADR when Phase 2 planning begins in earnest.*
