-- =============================================================================
-- SAAHS — Migration 003b: Notice Sections & Library Folders
-- Description:
--   Must be run AFTER 003a_new_roles.sql has been committed.
--
--   1. Adds notice_section enum + new notice columns (section, image_url, document_type)
--   2. Creates lib_folders table with RLS
--   3. Adds folder_id, course, semester to library_resources
--   4. Adds is_pgimer_student, institution_name, membership_payment_status,
--      razorpay_payment_id to profiles
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1: notice_section enum + new notice columns
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notice_section') THEN
    CREATE TYPE public.notice_section AS ENUM (
      'General',
      'Letters & Minutes',
      'Documents'
    );
  END IF;
END$$;

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS section public.notice_section NOT NULL DEFAULT 'General';

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS document_type TEXT;

CREATE INDEX IF NOT EXISTS idx_notices_section ON public.notices (section);

-- ---------------------------------------------------------------------------
-- SECTION 2: E-Library folder structure
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lib_folders (
  id          BIGSERIAL     PRIMARY KEY,
  name        TEXT          NOT NULL CHECK (char_length(name) BETWEEN 1 AND 255),
  course      TEXT          NOT NULL,
  semester    TEXT          NOT NULL,
  created_by  UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.lib_folders IS
  'Course/semester folder containers for the E-Library structured view.';

CREATE INDEX IF NOT EXISTS idx_lib_folders_course
  ON public.lib_folders (course);
CREATE INDEX IF NOT EXISTS idx_lib_folders_semester
  ON public.lib_folders (semester);

ALTER TABLE public.lib_folders ENABLE ROW LEVEL SECURITY;

-- Drop policies first in case of re-run
DROP POLICY IF EXISTS "lib_folders_select_members"   ON public.lib_folders;
DROP POLICY IF EXISTS "lib_folders_insert_authorized" ON public.lib_folders;
DROP POLICY IF EXISTS "lib_folders_delete_authorized" ON public.lib_folders;

CREATE POLICY "lib_folders_select_members"
  ON public.lib_folders FOR SELECT
  USING (TRUE);

-- NOTE: 'Faculty' and other new roles are safe to reference here because
-- 003a_new_roles.sql has already committed them.
CREATE POLICY "lib_folders_insert_authorized"
  ON public.lib_folders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role::text IN (
          'Faculty', 'Literary Secretary', 'General Secretary',
          'Vice President', 'President'
        )
    )
  );

CREATE POLICY "lib_folders_delete_authorized"
  ON public.lib_folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role::text IN (
          'Faculty', 'Literary Secretary', 'General Secretary',
          'Vice President', 'President'
        )
    )
  );

-- Add folder reference columns to library_resources
ALTER TABLE public.library_resources
  ADD COLUMN IF NOT EXISTS folder_id BIGINT REFERENCES public.lib_folders(id) ON DELETE SET NULL;

ALTER TABLE public.library_resources
  ADD COLUMN IF NOT EXISTS course TEXT;

ALTER TABLE public.library_resources
  ADD COLUMN IF NOT EXISTS semester TEXT;

CREATE INDEX IF NOT EXISTS idx_library_resources_folder_id
  ON public.library_resources (folder_id);
CREATE INDEX IF NOT EXISTS idx_library_resources_course
  ON public.library_resources (course);

-- ---------------------------------------------------------------------------
-- SECTION 3: Profile fields for PGIMER vs outside member flow
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_pgimer_student BOOLEAN DEFAULT TRUE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution_name TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_payment_status TEXT DEFAULT 'pending';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

COMMENT ON COLUMN public.profiles.is_pgimer_student
  IS 'TRUE if PGIMER student; FALSE for outside paid members.';
COMMENT ON COLUMN public.profiles.institution_name
  IS 'Institution name for non-PGIMER outside members.';
COMMENT ON COLUMN public.profiles.membership_payment_status
  IS 'Payment lifecycle: pending | paid | failed.';
COMMENT ON COLUMN public.profiles.razorpay_payment_id
  IS 'Razorpay payment ID stored after successful payment.';

-- =============================================================================
-- END OF MIGRATION: 003b_notices_library.sql
-- =============================================================================
