-- !! REFERENCE ONLY — DO NOT RUN AGAINST SUPABASE !!
-- !! This file is CTO target architecture for a future Azure PostgreSQL migration. !!
-- !! Active Supabase migrations are in supabase/migrations/ only.                 !!
-- !! See docs/architecture/ADR-001-integration-strategy.md for context.           !!
--
-- 002_enable_rls.sql
SET search_path TO vera_core, public;

ALTER TABLE vera_core.associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vera_core.associations FORCE ROW LEVEL SECURITY;
CREATE POLICY associations_select ON vera_core.associations
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY associations_insert ON vera_core.associations
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY associations_update ON vera_core.associations
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY associations_delete ON vera_core.associations
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);

ALTER TABLE vera_core.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vera_core.users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_select ON vera_core.users
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY users_insert ON vera_core.users
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY users_update ON vera_core.users
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY users_delete ON vera_core.users
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);

ALTER TABLE vera_core.association_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE vera_core.association_memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY memberships_select ON vera_core.association_memberships
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY memberships_insert ON vera_core.association_memberships
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY memberships_update ON vera_core.association_memberships
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY memberships_delete ON vera_core.association_memberships
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);

ALTER TABLE vera_core.user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vera_core.user_role_assignments FORCE ROW LEVEL SECURITY;
CREATE POLICY role_assignments_select ON vera_core.user_role_assignments
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY role_assignments_insert ON vera_core.user_role_assignments
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY role_assignments_update ON vera_core.user_role_assignments
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY role_assignments_delete ON vera_core.user_role_assignments
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);

ALTER TABLE vera_core.user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vera_core.user_invitations FORCE ROW LEVEL SECURITY;
CREATE POLICY invitations_select ON vera_core.user_invitations
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY invitations_insert ON vera_core.user_invitations
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY invitations_update ON vera_core.user_invitations
  FOR UPDATE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY invitations_delete ON vera_core.user_invitations
  FOR DELETE USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);

ALTER TABLE vera_core.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vera_core.audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_select ON vera_core.audit_logs
  FOR SELECT USING (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
CREATE POLICY audit_logs_insert ON vera_core.audit_logs
  FOR INSERT WITH CHECK (organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid);
