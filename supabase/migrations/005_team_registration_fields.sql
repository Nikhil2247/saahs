-- =============================================================================
-- Migration: 005_team_registration_fields.sql
-- Description: Extend event_registrations with team creation, captain indicator,
--              and player roster (team_members JSONB) for sports events.
-- =============================================================================

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS team_name    TEXT,
  ADD COLUMN IF NOT EXISTS is_captain   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS team_members JSONB   NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.event_registrations.team_name    IS 'Name of the squad/team created for team sports.';
COMMENT ON COLUMN public.event_registrations.is_captain   IS 'TRUE if this registrant created the team and serves as team captain.';
COMMENT ON COLUMN public.event_registrations.team_members IS 'JSON array of squad members: [{ name, roll_number, department, phone, is_captain }].';

-- Index for searching teams quickly
CREATE INDEX IF NOT EXISTS idx_event_registrations_team_name ON public.event_registrations (team_name) WHERE team_name IS NOT NULL;

-- =============================================================================
-- END OF MIGRATION: 005_team_registration_fields.sql
-- =============================================================================
