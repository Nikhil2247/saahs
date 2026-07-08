-- =============================================================================
-- SAAHS (Student Association of Allied Health Sciences) — Initial Schema
-- Migration: 001_initial_schema.sql
-- Description: Full database foundation including ENUMs, tables, indexes,
--              auto-timestamp triggers, auth sync trigger, and RLS policies.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSION: enable pgcrypto for UUID generation helpers
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- SECTION 1: ENUM TYPE DEFINITIONS
-- =============================================================================

-- User roles in the SAAHS hierarchy
CREATE TYPE public.user_role AS ENUM (
  'Public User',
  'SAAHS Member',
  'Executive Body Member',
  'Governing Body Member',
  'Literary Secretary',
  'Treasurer',
  'General Secretary',
  'Vice President',
  'President'
);

-- Membership application lifecycle
CREATE TYPE public.membership_status AS ENUM (
  'Pending',
  'Approved',
  'Rejected'
);

-- Grievance / help-desk ticket lifecycle
CREATE TYPE public.grievance_status AS ENUM (
  'Submitted',
  'Under Review',
  'In Progress',
  'Resolved',
  'Closed'
);

-- Notice board categories
CREATE TYPE public.notice_category AS ENUM (
  'General',
  'Administrative',
  'Academic',
  'Event',
  'Election',
  'Circular'
);

-- Event categories
CREATE TYPE public.event_category AS ENUM (
  'Academic',
  'Cultural',
  'Sports',
  'Literary',
  'Workshops',
  'Conferences'
);

-- E-Library resource categories
CREATE TYPE public.library_category AS ENUM (
  'Notes',
  'Previous Year Papers',
  'Books',
  'SOPs',
  'Research Papers',
  'Presentations',
  'Guidelines',
  'Academic Resources',
  'Official Documents'
);

-- =============================================================================
-- SECTION 2: HELPER FUNCTION — AUTO-UPDATE updated_at COLUMN
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =============================================================================
-- SECTION 3: TABLE DEFINITIONS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: profiles
-- One-to-one with auth.users. Created automatically via trigger on sign-up.
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  -- Primary key mirrors Supabase Auth user UUID
  id                UUID          PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity fields — populated during onboarding questionnaire
  full_name         TEXT,
  email             TEXT          NOT NULL,
  phone_number      TEXT          CHECK (phone_number ~ '^\+?[0-9\s\-]{7,15}$'),
  department        TEXT,
  course            TEXT,
  batch_year        TEXT          CHECK (batch_year ~ '^\d{4}$'),
  roll_number       TEXT,

  -- Cloudinary public URL for profile avatar
  avatar_url        TEXT,

  -- RBAC role; defaults to lowest privilege
  role              public.user_role         NOT NULL DEFAULT 'Public User',
  membership_status public.membership_status NOT NULL DEFAULT 'Pending',

  -- Onboarding flag: set TRUE after first-time metadata form is completed
  onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles IS 'Extended user profile data; primary key is the Supabase Auth user UUID.';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Cloudinary public delivery URL for the profile picture.';
COMMENT ON COLUMN public.profiles.onboarding_complete IS 'Flag set TRUE once the user has completed the first-time metadata questionnaire.';

-- Auto-update updated_at on every row modification
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_profiles_role             ON public.profiles (role);
CREATE INDEX idx_profiles_membership_status ON public.profiles (membership_status);
CREATE INDEX idx_profiles_department        ON public.profiles (department);
CREATE INDEX idx_profiles_email             ON public.profiles (email);

-- ---------------------------------------------------------------------------
-- TABLE: notices
-- Bulletin-board style notices with optional pinning and attachments.
-- ---------------------------------------------------------------------------
CREATE TABLE public.notices (
  id              BIGSERIAL       PRIMARY KEY,
  title           TEXT            NOT NULL CHECK (char_length(title) BETWEEN 5 AND 255),
  content         TEXT            NOT NULL,
  category        public.notice_category NOT NULL DEFAULT 'General',

  -- Cloudinary asset URL for an optional notice attachment (PDF, image, etc.)
  attachment_url  TEXT,

  is_pinned       BOOLEAN         NOT NULL DEFAULT FALSE,

  -- FK to the profile that created this notice
  created_by      UUID            NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Timestamps (no updated_at needed; notices are immutable once published)
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.notices IS 'Official notices and circulars published on the SAAHS portal.';
COMMENT ON COLUMN public.notices.attachment_url IS 'Cloudinary asset URL for any attached document.';

-- Indexes
CREATE INDEX idx_notices_category   ON public.notices (category);
CREATE INDEX idx_notices_is_pinned  ON public.notices (is_pinned);
CREATE INDEX idx_notices_created_at ON public.notices (created_at DESC);
CREATE INDEX idx_notices_created_by ON public.notices (created_by);

-- ---------------------------------------------------------------------------
-- TABLE: events
-- Upcoming and past SAAHS events.
-- ---------------------------------------------------------------------------
CREATE TABLE public.events (
  id              BIGSERIAL       PRIMARY KEY,
  title           TEXT            NOT NULL CHECK (char_length(title) BETWEEN 5 AND 255),
  description     TEXT            NOT NULL,
  category        public.event_category NOT NULL,

  -- Cloudinary URL for event banner image
  banner_url      TEXT,

  schedule        TIMESTAMPTZ     NOT NULL,
  venue           TEXT            NOT NULL,
  organizer_info  TEXT,

  -- When TRUE the event is part of the historical archive
  past_archive    BOOLEAN         NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.events IS 'SAAHS events — both upcoming and archived past events.';
COMMENT ON COLUMN public.events.banner_url     IS 'Cloudinary public URL for event banner image.';
COMMENT ON COLUMN public.events.past_archive   IS 'TRUE once an event is moved to the historical archive.';

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_events_category     ON public.events (category);
CREATE INDEX idx_events_schedule     ON public.events (schedule);
CREATE INDEX idx_events_past_archive ON public.events (past_archive);

-- ---------------------------------------------------------------------------
-- TABLE: event_registrations
-- Tracks which authenticated users have registered for which events.
-- ---------------------------------------------------------------------------
CREATE TABLE public.event_registrations (
  id            BIGSERIAL   PRIMARY KEY,
  event_id      BIGINT      NOT NULL REFERENCES public.events(id)    ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A user may only register once per event
  CONSTRAINT uq_event_registrations UNIQUE (event_id, user_id)
);

COMMENT ON TABLE public.event_registrations IS 'Junction table recording individual event registrations.';

CREATE INDEX idx_event_registrations_event_id ON public.event_registrations (event_id);
CREATE INDEX idx_event_registrations_user_id  ON public.event_registrations (user_id);

-- ---------------------------------------------------------------------------
-- TABLE: grievances
-- Support / help-desk tickets. Supports anonymous submissions.
-- ---------------------------------------------------------------------------
CREATE TABLE public.grievances (
  id              BIGSERIAL               PRIMARY KEY,

  -- Short human-readable ticket reference, e.g. "GRV-7F3A"
  ticket_number   TEXT                    NOT NULL UNIQUE,

  is_anonymous    BOOLEAN                 NOT NULL DEFAULT FALSE,

  -- Nullable: NULL when the grievance is anonymous
  user_id         UUID                    REFERENCES public.profiles(id) ON DELETE SET NULL,

  category        TEXT                    NOT NULL CHECK (char_length(category) BETWEEN 2 AND 100),
  title           TEXT                    NOT NULL CHECK (char_length(title)    BETWEEN 5 AND 255),
  description     TEXT                    NOT NULL CHECK (char_length(description) >= 10),

  -- Cloudinary URL for any supporting document uploaded by the student
  attachment_url  TEXT,

  status          public.grievance_status NOT NULL DEFAULT 'Submitted',

  -- Admin / committee response text
  admin_response  TEXT,

  created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.grievances IS 'Student grievance / help-desk tickets; supports anonymous submission.';
COMMENT ON COLUMN public.grievances.ticket_number IS 'Short unique alphanumeric reference, e.g. GRV-7F3A.';
COMMENT ON COLUMN public.grievances.user_id       IS 'NULL for anonymous grievances.';

CREATE TRIGGER trg_grievances_updated_at
  BEFORE UPDATE ON public.grievances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_grievances_user_id      ON public.grievances (user_id);
CREATE INDEX idx_grievances_status       ON public.grievances (status);
CREATE INDEX idx_grievances_is_anonymous ON public.grievances (is_anonymous);
CREATE INDEX idx_grievances_created_at   ON public.grievances (created_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: library_resources
-- E-library documents managed by authorized members.
-- ---------------------------------------------------------------------------
CREATE TABLE public.library_resources (
  id          BIGSERIAL               PRIMARY KEY,
  title       TEXT                    NOT NULL CHECK (char_length(title) BETWEEN 3 AND 255),
  category    public.library_category NOT NULL,

  -- Cloudinary raw asset delivery URL (PDF, PPTX, DOCX, etc.)
  file_url    TEXT                    NOT NULL,

  -- Metadata helpers
  file_size_bytes BIGINT,
  mime_type       TEXT,

  -- FK to the profile that uploaded the resource
  upload_by   UUID                    NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at  TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.library_resources IS 'E-library resources: notes, past papers, SOPs, research papers, etc.';
COMMENT ON COLUMN public.library_resources.file_url IS 'Cloudinary asset delivery URL for the document.';

CREATE INDEX idx_library_resources_category  ON public.library_resources (category);
CREATE INDEX idx_library_resources_upload_by ON public.library_resources (upload_by);
CREATE INDEX idx_library_resources_created_at ON public.library_resources (created_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: meetings
-- SAAHS executive / governing body meeting records.
-- ---------------------------------------------------------------------------
CREATE TABLE public.meetings (
  id                  BIGSERIAL   PRIMARY KEY,
  title               TEXT        NOT NULL CHECK (char_length(title) BETWEEN 5 AND 255),
  notice_date         DATE        NOT NULL,
  agenda              TEXT,

  -- JSON array of attendee objects: [{ "user_id": "...", "name": "...", "present": true }]
  attendance          JSONB       NOT NULL DEFAULT '[]'::JSONB,

  minutes_of_meeting  TEXT,

  -- JSON array of action items: [{ "item": "...", "assignee": "...", "due_date": "..." }]
  action_items        JSONB       NOT NULL DEFAULT '[]'::JSONB,

  -- Cloudinary URL for scanned / digital meeting minutes attachment
  attachment_url      TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.meetings IS 'Executive and governing body meeting records with attendance and minutes.';
COMMENT ON COLUMN public.meetings.attendance    IS 'JSONB array of attendees with presence flag.';
COMMENT ON COLUMN public.meetings.action_items  IS 'JSONB array of action items arising from the meeting.';

CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_meetings_notice_date ON public.meetings (notice_date DESC);

-- =============================================================================
-- SECTION 4: AUTH SYNC TRIGGER
-- Automatically create a profiles row when a new user signs up via Supabase Auth.
-- Extracts name and avatar from Google OAuth raw_user_meta_data.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
-- Required to allow writes to public.profiles from the auth schema trigger
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    avatar_url,
    role,
    membership_status,
    onboarding_complete
  )
  VALUES (
    NEW.id,
    -- Google OAuth stores the display name under "full_name" or "name"
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)   -- Fallback: local part of email
    ),
    NEW.email,
    -- Google OAuth stores the profile picture under "avatar_url" or "picture"
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'picture'
    ),
    'Public User',   -- Default lowest-privilege role
    'Pending',       -- Membership starts as Pending
    FALSE            -- Must complete onboarding questionnaire
  )
  ON CONFLICT (id) DO NOTHING;  -- Idempotent: no-op if profile already exists

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users (fires after INSERT, i.e., new sign-ups)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =============================================================================
-- SECTION 5: ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: A stable, immutable function to retrieve the role of the caller.
-- Using SECURITY DEFINER + search_path prevents privilege escalation.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- 5.1  profiles
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone (including public) can read profiles of office-bearers and above
-- so that the leadership page can render without authentication.
CREATE POLICY "profiles_select_public_leadership"
  ON public.profiles FOR SELECT
  USING (
    role IN (
      'President', 'Vice President', 'General Secretary',
      'Treasurer', 'Literary Secretary',
      'Executive Body Member', 'Governing Body Member'
    )
  );

-- Authenticated users can always read their own profile
CREATE POLICY "profiles_select_self"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admins can read all profiles (for membership management, etc.)
CREATE POLICY "profiles_select_admins"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN ('President', 'Vice President', 'General Secretary')
  );

-- Users may update their own profile but NOT change role or membership_status
-- (role elevation is admin-only — handled by a separate admin policy)
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING  (id = auth.uid())
  WITH CHECK (
    -- Prevent self-escalation of privileged fields
    role              = (SELECT role              FROM public.profiles WHERE id = auth.uid()) AND
    membership_status = (SELECT membership_status FROM public.profiles WHERE id = auth.uid())
  );

-- Admins can update any profile field including role and membership_status
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() IN ('President', 'Vice President', 'General Secretary')
  );

-- ---------------------------------------------------------------------------
-- 5.2  notices
-- ---------------------------------------------------------------------------
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Public read (notices are publicly visible)
CREATE POLICY "notices_select_public"
  ON public.notices FOR SELECT
  USING (TRUE);

-- Only designated roles may create notices
CREATE POLICY "notices_insert_authorized"
  ON public.notices FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN (
      'President', 'Vice President', 'General Secretary', 'Literary Secretary'
    )
  );

-- Same roles may update notices
CREATE POLICY "notices_update_authorized"
  ON public.notices FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() IN (
      'President', 'Vice President', 'General Secretary', 'Literary Secretary'
    )
  );

-- Same roles may delete notices
CREATE POLICY "notices_delete_authorized"
  ON public.notices FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() IN (
      'President', 'Vice President', 'General Secretary', 'Literary Secretary'
    )
  );

-- ---------------------------------------------------------------------------
-- 5.3  events
-- ---------------------------------------------------------------------------
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "events_select_public"
  ON public.events FOR SELECT
  USING (TRUE);

-- Authorized roles may create events
CREATE POLICY "events_insert_authorized"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN (
      'President', 'Vice President', 'General Secretary', 'Literary Secretary'
    )
  );

-- Authorized roles may update events
CREATE POLICY "events_update_authorized"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() IN (
      'President', 'Vice President', 'General Secretary', 'Literary Secretary'
    )
  );

-- Authorized roles may delete events
CREATE POLICY "events_delete_authorized"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() IN (
      'President', 'Vice President', 'General Secretary', 'Literary Secretary'
    )
  );

-- ---------------------------------------------------------------------------
-- 5.4  event_registrations
-- ---------------------------------------------------------------------------
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own registrations
CREATE POLICY "event_reg_select_self"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all registrations
CREATE POLICY "event_reg_select_admin"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN (
      'President', 'Vice President', 'General Secretary',
      'Executive Body Member', 'Governing Body Member'
    )
  );

-- Any authenticated user may register themselves (not others)
CREATE POLICY "event_reg_insert_self"
  ON public.event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users may cancel their own registration
CREATE POLICY "event_reg_delete_self"
  ON public.event_registrations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5.5  grievances
-- ---------------------------------------------------------------------------
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated or not) may submit a grievance
CREATE POLICY "grievances_insert_anyone"
  ON public.grievances FOR INSERT
  WITH CHECK (TRUE);

-- Non-anonymous: visible to the submitter themselves
CREATE POLICY "grievances_select_self"
  ON public.grievances FOR SELECT
  TO authenticated
  USING (
    is_anonymous = FALSE AND user_id = auth.uid()
  );

-- Admins can see all grievances (anonymous and non-anonymous)
CREATE POLICY "grievances_select_admin"
  ON public.grievances FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN ('President', 'Vice President', 'General Secretary')
  );

-- Only admins may update a grievance (to add response, change status)
CREATE POLICY "grievances_update_admin"
  ON public.grievances FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() IN ('President', 'Vice President', 'General Secretary')
  );

-- ---------------------------------------------------------------------------
-- 5.6  library_resources
-- ---------------------------------------------------------------------------
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;

-- Approved SAAHS members and above may browse the library
CREATE POLICY "library_select_members"
  ON public.library_resources FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN (
      'SAAHS Member', 'Executive Body Member', 'Governing Body Member',
      'Literary Secretary', 'Treasurer', 'General Secretary',
      'Vice President', 'President'
    )
  );

-- Literary Secretary and above may upload resources
CREATE POLICY "library_insert_authorized"
  ON public.library_resources FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN (
      'Literary Secretary', 'General Secretary', 'Vice President', 'President'
    )
  );

-- Literary Secretary and above may delete resources
CREATE POLICY "library_delete_authorized"
  ON public.library_resources FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() IN (
      'Literary Secretary', 'General Secretary', 'Vice President', 'President'
    )
  );

-- ---------------------------------------------------------------------------
-- 5.7  meetings
-- ---------------------------------------------------------------------------
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Executive Body Members and above may read meeting logs
CREATE POLICY "meetings_select_executive"
  ON public.meetings FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN (
      'Executive Body Member', 'Governing Body Member',
      'Literary Secretary', 'Treasurer', 'General Secretary',
      'Vice President', 'President'
    )
  );

-- Only core admins (President, VP, GS) may create meeting records
CREATE POLICY "meetings_insert_admin"
  ON public.meetings FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_my_role() IN ('President', 'Vice President', 'General Secretary')
  );

-- Core admins may update meeting records
CREATE POLICY "meetings_update_admin"
  ON public.meetings FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() IN ('President', 'Vice President', 'General Secretary')
  );

-- Core admins may delete meeting records
CREATE POLICY "meetings_delete_admin"
  ON public.meetings FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() IN ('President', 'Vice President', 'General Secretary')
  );

-- =============================================================================
-- END OF MIGRATION: 001_initial_schema.sql
-- =============================================================================
