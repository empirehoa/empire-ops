-- !! REFERENCE ONLY — DO NOT RUN AGAINST SUPABASE !!
-- !! This file is CTO target architecture for a future Azure PostgreSQL migration. !!
-- !! Active Supabase migrations are in supabase/migrations/ only.                 !!
-- !! See docs/architecture/ADR-001-integration-strategy.md for context.           !!
--
-- 001_create_access_control_tables.sql
SET search_path TO vera_core, public;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS vera_core.management_organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(150) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NULL,
    updated_by uuid NULL,
    deleted_at timestamptz NULL
);

CREATE TABLE IF NOT EXISTS vera_core.roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(50) NOT NULL UNIQUE,
    description varchar(255) NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vera_core.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES vera_core.management_organizations(id),
    email varchar(255) NOT NULL,
    first_name varchar(120) NOT NULL,
    last_name varchar(120) NOT NULL,
    entra_object_id varchar(120) NULL,
    status varchar(20) NOT NULL DEFAULT 'invited',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NULL,
    updated_by uuid NULL,
    deleted_at timestamptz NULL,
    CONSTRAINT users_org_email_unique UNIQUE (organization_id, email)
);
CREATE UNIQUE INDEX IF NOT EXISTS users_entra_object_id_unique
    ON vera_core.users(entra_object_id)
    WHERE entra_object_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS vera_core.associations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES vera_core.management_organizations(id),
    name varchar(150) NOT NULL,
    association_type varchar(30) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'onboarding',
    city varchar(120) NULL,
    state varchar(2) NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NULL,
    updated_by uuid NULL,
    deleted_at timestamptz NULL
);

CREATE TABLE IF NOT EXISTS vera_core.association_memberships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES vera_core.management_organizations(id),
    association_id uuid NOT NULL REFERENCES vera_core.associations(id),
    user_id uuid NOT NULL REFERENCES vera_core.users(id),
    membership_type varchar(30) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NULL,
    updated_by uuid NULL,
    deleted_at timestamptz NULL,
    CONSTRAINT association_memberships_unique UNIQUE (association_id, user_id)
);

CREATE TABLE IF NOT EXISTS vera_core.user_role_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES vera_core.management_organizations(id),
    association_id uuid NULL REFERENCES vera_core.associations(id),
    user_id uuid NOT NULL REFERENCES vera_core.users(id),
    role_id uuid NOT NULL REFERENCES vera_core.roles(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NULL,
    updated_by uuid NULL,
    deleted_at timestamptz NULL,
    CONSTRAINT user_role_assignments_unique UNIQUE (user_id, role_id, association_id)
);

CREATE TABLE IF NOT EXISTS vera_core.user_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES vera_core.management_organizations(id),
    association_id uuid NULL REFERENCES vera_core.associations(id),
    email varchar(255) NOT NULL,
    invitation_token varchar(255) NOT NULL UNIQUE,
    role varchar(50) NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'pending',
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NULL,
    updated_by uuid NULL,
    deleted_at timestamptz NULL
);

CREATE TABLE IF NOT EXISTS vera_core.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES vera_core.management_organizations(id),
    association_id uuid NULL REFERENCES vera_core.associations(id),
    user_id uuid NULL REFERENCES vera_core.users(id),
    action varchar(100) NOT NULL,
    subject_type varchar(100) NOT NULL,
    subject_id uuid NULL,
    before_state jsonb NULL,
    after_state jsonb NULL,
    request_id varchar(120) NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_organization_id ON vera_core.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_associations_organization_id ON vera_core.associations(organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON vera_core.association_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_association_id ON vera_core.association_memberships(association_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user_id ON vera_core.user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON vera_core.user_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON vera_core.audit_logs(organization_id);
