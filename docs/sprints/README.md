# Vera Developer Ready Package v1

This package is the Sprint 1 build-start handoff for Vera.

## What changed in this package

This version closes the specific approval gaps raised in the architecture review:
- `vera_core` schema bootstrap now exists and runs first
- OpenAPI is versioned under `/api/v1`
- `BearerAuth`, pagination, `StandardErrorResponse`, and invitation idempotency are defined
- ERD includes `audit_logs`, `user_invitations`, unique constraints, audit columns, and RLS coverage notes
- RLS policy pattern is documented and backed by migration SQL
- Tenant middleware is transaction-safe and returns `USER_NOT_PROVISIONED`
- A non-HTTP `TenantContext` helper is included for seeders, jobs, and artisan commands
- Dockerfile and CI skeleton are now present

## Locked decisions

- Phase 1 = auth, tenant isolation, user lifecycle, invitations, and access control
- Financial core starts in Sprint 3 after tenant isolation tests pass in staging
- `lcobucci/jwt` is the Phase 1 JWT validation library
- `entra_object_id` is the Phase 1 identity anchor
- `management_organizations` and `roles` are excluded from RLS by design
- PgBouncer must use transaction pooling mode if adopted later

## Folder guide

- `docs/` — human-readable package and onboarding docs
- `api/` — OpenAPI contract
- `db/migrations/` — schema bootstrap, tables, and RLS policies
- `db/erd/` — rendered data model
- `backend/` — Laravel-oriented starter artifacts
- `docker/` — local container startup files
- `.github/workflows/` — CI starting point
- `infra/` — staging infrastructure stubs

## Boot sequence for a developer

1. Read `docs/VERA_Technical_Foundation_Pack_v2.docx`
2. Review `api/vera_openapi_v1.yaml`
3. Review `db/erd/vera_erd_v2.png`
4. Copy `.env.example` values into local `.env`
5. Run `docker compose up --build`
6. Run migrations
7. Run tests
8. Confirm the RLS isolation tests pass before any feature work begins

## Sprint 1 rules

- Do not trust tenant context from the frontend
- Do not bypass RLS with ad hoc SQL
- Do not use `SET` without `LOCAL`
- Do not add financial tables in Phase 1
- Do not move audit logging to async write mode in Phase 1
- Do not enforce permissions only in Angular

## Approval checklist

- [ ] `vera_core` schema bootstrap migration runs first
- [ ] RLS policies exist for tenant-scoped tables
- [ ] Tenant middleware wraps the request in a transaction
- [ ] `USER_NOT_PROVISIONED` is returned when `oid` is unknown
- [ ] OpenAPI includes v1 prefix, BearerAuth, pagination, CRUD, and standard errors
- [ ] ERD reflects audit tables, constraints, and RLS scope
- [ ] Dockerfile builds and CI runs tests

## Notes for Sprint 2

Sprint 2 expands user lifecycle, invitations, membership management, and role-aware UI. Permission-based RBAC remains deferred until Sprint 4.
