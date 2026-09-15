-- =============================================================================
-- SAAHS — Migration 003a: New Role Enum Values
-- Description:
--   Adds Faculty, PGIMER Student, and Outside Member to the user_role enum.
--
-- ⚠️  IMPORTANT: Run THIS file first and wait for it to succeed before
--   running 003b_notices_library.sql.
--
--   PostgreSQL requires ALTER TYPE ... ADD VALUE to be committed in its own
--   transaction before the new values can be referenced anywhere else.
-- =============================================================================

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Faculty';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'PGIMER Student';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'Outside Member';

-- =============================================================================
-- END OF MIGRATION: 003a_new_roles.sql
-- Run 003b_notices_library.sql next.
-- =============================================================================
