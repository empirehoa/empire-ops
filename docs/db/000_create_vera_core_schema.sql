-- !! REFERENCE ONLY — DO NOT RUN AGAINST SUPABASE !!
-- !! This file is CTO target architecture for a future Azure PostgreSQL migration. !!
-- !! Active Supabase migrations are in supabase/migrations/ only.                 !!
-- !! See docs/architecture/ADR-001-integration-strategy.md for context.           !!
--
-- 000_create_vera_core_schema.sql
CREATE SCHEMA IF NOT EXISTS vera_core;
SET search_path TO vera_core, public;
