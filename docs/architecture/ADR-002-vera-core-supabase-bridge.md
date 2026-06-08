# ADR-002: vera_core Schema in Supabase via Bridge Pattern

**Status**: Accepted  
**Date**: 2026-04-03  
**Authors**: JR Riestra (CEO), Claude (AI Architect)

---

## Context

The CTO designed `vera_core` for Azure PostgreSQL. Vera runs on Supabase. PostgREST (Supabase's auto-API layer) only exposes schemas explicitly listed in `config.toml` — by default only `public`. The `vera_core` schema was deferred in ADR-001 because of three concerns:

1. PostgREST cannot expose `vera_core` tables directly without configuration changes
2. Cross-schema foreign key complexity between `vera_core` and `public`
3. RLS session variable conflict: CTO's pattern uses `SET LOCAL app.current_organization_id` (GUC-based); Vera uses `auth.uid()` from Supabase JWTs

All three concerns are now resolved via the bridge pattern described in this ADR.

---

## Decision

Add `vera_core` to Supabase (migrations 104–106) with three targeted adaptations:

### Adaptation 1: Dual-pattern RLS bridge function

```sql
CREATE OR REPLACE FUNCTION vera_core.current_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  v_guc text;
BEGIN
  -- Check CTO pattern first: GUC set by Laravel middleware
  v_guc := current_setting('app.current_organization_id', true);
  IF v_guc IS NOT NULL AND v_guc <> '' THEN
    RETURN v_guc::uuid;
  END IF;

  -- Fall back to Vera pattern: organization_id from Supabase JWT claims
  RETURN (
    SELECT mo.id
    FROM public.management_organizations mo
    WHERE mo.tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    LIMIT 1
  );
END;
$$;
```

This function is the central bridge. CTO RLS policies that call `vera_core.current_organization_id()` work without modification in both Supabase (JWT path) and Azure PostgreSQL with Laravel (GUC path).

### Adaptation 2: Public schema bridge views for PostgREST

```sql
CREATE OR REPLACE VIEW public.v_vera_core_organizations AS
  SELECT * FROM vera_core.organizations
  WHERE id = vera_core.current_organization_id();

CREATE OR REPLACE VIEW public.v_vera_core_associations AS
  SELECT * FROM vera_core.associations
  WHERE organization_id = vera_core.current_organization_id();
```

PostgREST serves these views at `/rest/v1/v_vera_core_organizations` and `/rest/v1/v_vera_core_associations`. The `/api/v1/organizations` and `/api/v1/associations` Next.js routes proxy these endpoints, presenting them as first-class API resources.

### Adaptation 3: Bridge columns linking public and vera_core

```sql
-- Links public.management_organizations to vera_core.organizations
ALTER TABLE public.management_organizations
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES vera_core.organizations(id);

-- Links vera_core.associations to public association records
ALTER TABLE vera_core.associations
  ADD COLUMN IF NOT EXISTS public_assoc_id uuid;
```

These bridge columns allow queries to join across schemas during the transitional period. They are removed in Phase 2 when the public schema is deprecated in favor of `vera_core` as the canonical source.

---

## Consequences

### Positive

- CTO can inspect `vera_core` tables directly in the Supabase Table Editor — no special tooling required
- CTO SQL DDL runs verbatim against Supabase with no modifications
- `/api/v1/organizations` and `/api/v1/associations` are live and return real data
- `/api/v1/ai/stanai` unified route has access to `vera_core`-structured data
- RLS policies written to CTO spec work in both environments without branching
- Phase 2 migration to Azure PostgreSQL is non-breaking: remove bridge views, run PostgREST config pointing at Azure, swap connection strings

### Negative / Risks

- Bridge views add one layer of indirection; performance is equivalent to a direct table scan but slightly more complex query plans
- The `SECURITY DEFINER` on `vera_core.current_organization_id()` means the function runs with elevated permissions — the function body must never be expanded to include writes
- Cross-schema foreign keys (`public.management_organizations.tenant_id → vera_core.organizations.id`) create a dependency that must be resolved before either schema can be independently migrated
- Bridge columns (`tenant_id`, `public_assoc_id`) will accumulate data during Phase 1; they must be back-filled before Phase 2 migration or data loss will occur

---

## Phase 2 Migration Path

When Vera migrates to Azure PostgreSQL Flexible Server:

1. Remove `public.v_vera_core_*` bridge views from Supabase
2. Remove bridge columns (`tenant_id` on `management_organizations`, `public_assoc_id` on `associations`)
3. Update PostgREST `config.toml` to expose `vera_core` directly (or route through Laravel)
4. Remove the JWT fallback branch from `vera_core.current_organization_id()` — GUC is the only path
5. Deprecate `public.get_tenant_id()` in favor of `vera_core.current_organization_id()`

The bridge function signature does not change. All callers are unaffected.

---

## Related ADRs

- ADR-001: CTO Architecture Integration Strategy — original deferral decision
- ADR-004: Supabase as Database / Azure PostgreSQL as Phase 2 Target — infrastructure context

---

*Architecture Decision Records are living documents. Update this ADR when Phase 2 migration begins.*
