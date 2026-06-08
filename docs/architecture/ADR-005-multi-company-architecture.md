# ADR-005: Multi-Company Architecture for Vera Platform

**Status**: Proposed — Pending CTO Review  
**Date**: 2026-04-04  
**Authors**: JR Riestra (CEO), Claude (AI Architect)  
**Requires CTO Sign-off**: YES — before Sprint B implementation begins

---

## Context

Vera is currently built for a single management company (Empire Management Group) with a `tenant_id` multi-tenancy model. The business need has expanded: Vera must support multiple distinct management companies (e.g., Riance LLC portfolio: Empire Management Group, Riance Realty, Wind Fire & Water, FixIQ) and potentially external clients.

### Existing Tables (do NOT create a new one)

Two tables that represent management companies already exist:
- `management_companies` (migration 032, `public` schema) — original Vera model
- `vera_core.management_organizations` (migration 104, `vera_core` schema) — CTO architecture spec

The current `tenants` table (migration 001) holds the authorization layer: each `management_company` has one `tenant_id`.

### Problem Statement

We need a way to:
1. Create new management company workspaces (provisioning)
2. Switch between companies in the UI (super_admin only)
3. Enforce data isolation between companies (RLS)
4. Duplicate feature modules (associations, financials, etc.) per new company
5. Control which feature modules are enabled per company (licensing)

---

## Decision

### Company Table Consolidation

**Chosen approach**: Consolidate onto `vera_core.management_organizations`.

- Do NOT add a third `companies` table
- Migrate any data/usage from `management_companies` to `vera_core.management_organizations`
- The `tenant_id` column on `management_organizations` links to `tenants.id` — this is the authorization anchor
- All existing 118+ tables that use `tenant_id` continue to work unchanged

### RLS / Company Switcher Architecture

**Problem**: `get_tenant_id()` reads `organization_id` from the Supabase JWT claim. A super_admin's JWT is always their own tenant. Cross-tenant reads for the company switcher cannot be done via normal RLS.

**Chosen approach**: SECURITY DEFINER functions, not relaxed RLS policies.

```sql
-- Pattern for super_admin cross-tenant reads
CREATE OR REPLACE FUNCTION vera_core.list_organizations_for_super_admin()
RETURNS SETOF vera_core.management_organizations
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as function owner, bypasses RLS
SET search_path = vera_core, public
AS $$
BEGIN
  -- Only callable by users with super_admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY SELECT * FROM vera_core.management_organizations ORDER BY name;
END;
$$;
```

The company switcher API route calls this function. It does NOT directly query management_organizations with a service_role key.

For write operations (provisioning), a dedicated Edge Function with service_role access runs the provisioning job. The API route enqueues the job and returns a job ID; the frontend polls for completion.

### Provisioning Atomicity

Provisioning a new company requires:
1. Insert into `tenants`
2. Insert into `vera_core.management_organizations`
3. Seed default data: roles, permission sets, communication templates, notification preferences, default alert rules
4. Create default feature flag configuration

This is a 200ms+ operation with 10+ inserts. A synchronous API call will timeout under load.

**Chosen approach**: Async provisioning via `financial_event_outbox` pattern.

```
POST /api/v1/companies/provision
→ insert job into provisioning_queue (new table, migration 115)
→ return { jobId, status: 'pending' }

GET /api/v1/companies/provision/{jobId}
→ poll status until 'complete' or 'failed'
```

The provisioning worker runs as a scheduled CCR agent or triggered by Service Bus (Phase 2).

### Module / Feature Flag Architecture

**IMPORTANT**: Feature flags must NOT use `NEXT_PUBLIC_` prefix for API route protection.

```typescript
// WRONG — client-side only, doesn't protect API routes
const enabled = process.env.NEXT_PUBLIC_MULTI_COMPANY_ENABLED === 'true'

// CORRECT — server-side check in API route handlers
const enabled = process.env.MULTI_COMPANY_ENABLED === 'true'
```

Per-tenant module flags are stored in `tenant_modules` table (migration 115) and checked server-side in API routes via `isModuleEnabled(module, tenantId)`.

---

## Implementation Plan (Sprint B — deferred)

### Migration 115: Multi-Company Infrastructure

```sql
-- 1. provisioning_queue table (async job tracking)
-- 2. tenant_modules table (per-tenant feature flags)
-- 3. SECURITY DEFINER functions for cross-tenant reads
-- 4. vera_core.management_organizations as canonical company table
-- 5. Migrate management_companies data
```

### API Routes
- `POST /api/v1/companies/provision` — enqueue provisioning job
- `GET /api/v1/companies/provision/[jobId]` — poll job status
- `GET /api/v1/companies` — list companies (super_admin only, via SECURITY DEFINER fn)
- `PATCH /api/v1/companies/[id]` — update company settings

### UI
- Company switcher in header (super_admin only) — reads from `/api/v1/companies`
- New company form (name, slug, admin email, modules to enable)
- Provisioning progress indicator (polls job status)
- Per-company module enable/disable in Settings

### Module Guard
```typescript
// src/lib/modules.ts
export async function isModuleEnabled(
  module: string,
  tenantId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data } = await supabase
    .from('tenant_modules')
    .select('enabled')
    .eq('tenant_id', tenantId)
    .eq('module', module)
    .single()
  return data?.enabled ?? false
}
```

Called in API route handlers (not page components) to protect server-side data access.

---

## Questions Requiring CTO Input

1. Should `management_companies` (public schema) be deprecated immediately or maintained as a bridge?
2. Is the SECURITY DEFINER pattern acceptable, or should we use a dedicated service account?
3. Should provisioning workers run as CCR agents (current infrastructure) or Azure Functions (target infrastructure)?
4. What modules should be available for external client companies vs Empire internal?

---

## Consequence of Not Aligning

Implementing company switching without resolving the RLS model risks:
- Super admins reading data from wrong tenant if JWT claim is stale
- Service_role bypass being the only option, which bypasses all audit trails
- Conflicting interpretations of "tenant" between public.tenants, management_companies, and vera_core.management_organizations

Sprint B must not be executed until at least questions 1-3 are answered.

---

*Architecture Decision Records are living documents. Update this ADR when decisions are made.*
