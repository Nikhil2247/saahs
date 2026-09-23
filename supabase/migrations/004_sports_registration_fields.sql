-- =============================================================================
-- Migration: 004_sports_registration_fields.sql
-- Description: Extend event_registrations with sports-specific optional fields
--              for the SAAHS Sports Festival registration form.
-- =============================================================================

-- Add sports-specific columns to event_registrations
-- All columns are nullable so existing (non-sports) registrations are unaffected.

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS sport_choices   TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phone_number    TEXT,
  ADD COLUMN IF NOT EXISTS waiver_accepted BOOLEAN  NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.event_registrations.sport_choices   IS 'Array of selected sport/event names (e.g. Football, BGMI).';
COMMENT ON COLUMN public.event_registrations.phone_number    IS 'Contact phone number provided at registration time.';
COMMENT ON COLUMN public.event_registrations.waiver_accepted IS 'TRUE when the student has accepted the liability waiver.';

-- Index for querying registrations by event efficiently (already exists, but safe to add)
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations (event_id);

-- =============================================================================
-- END OF MIGRATION: 004_sports_registration_fields.sql
-- =============================================================================
