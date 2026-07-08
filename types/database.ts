/**
 * types/database.ts
 *
 * TypeScript representation of the SAAHS Supabase database schema.
 *
 * Every table, enum, and relationship from the SQL migration is represented
 * here as strongly-typed interfaces.  These types are consumed by the
 * Supabase client generics (createServerClient<Database>) to enable
 * autocomplete and compile-time query safety.
 *
 * Naming conventions:
 *  - Row   = the shape of a SELECT result row
 *  - Insert = the shape accepted by INSERT (optional cols have `?`)
 *  - Update = Partial<Insert> — every field is optional for PATCH semantics
 */

// ─── Enum literals ────────────────────────────────────────────────────────────

export type UserRole =
  | "Public User"
  | "SAAHS Member"
  | "Executive Body Member"
  | "Governing Body Member"
  | "Literary Secretary"
  | "Treasurer"
  | "General Secretary"
  | "Vice President"
  | "President";

export type MembershipStatus = "Pending" | "Approved" | "Rejected";

export type GrievanceStatus =
  | "Submitted"
  | "Under Review"
  | "In Progress"
  | "Resolved"
  | "Closed";

export type NoticeCategory =
  | "General"
  | "Administrative"
  | "Academic"
  | "Event"
  | "Election"
  | "Circular";

export type EventCategory =
  | "Academic"
  | "Cultural"
  | "Sports"
  | "Literary"
  | "Workshops"
  | "Conferences";

export type LibraryCategory =
  | "Notes"
  | "Previous Year Papers"
  | "Books"
  | "SOPs"
  | "Research Papers"
  | "Presentations"
  | "Guidelines"
  | "Academic Resources"
  | "Official Documents";

// ─── Table row types ──────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;                         // UUID — FK to auth.users
  full_name: string | null;
  email: string;
  phone_number: string | null;
  department: string | null;
  course: string | null;
  batch_year: string | null;          // e.g. "2023"
  roll_number: string | null;
  avatar_url: string | null;          // Cloudinary delivery URL
  role: UserRole;
  membership_status: MembershipStatus;
  onboarding_complete: boolean;
  created_at: string;                 // ISO-8601
  updated_at: string;                 // ISO-8601
}

export interface ProfileInsert {
  id: string;
  full_name?: string | null;
  email: string;
  phone_number?: string | null;
  department?: string | null;
  course?: string | null;
  batch_year?: string | null;
  roll_number?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  membership_status?: MembershipStatus;
  onboarding_complete?: boolean;
}

export type ProfileUpdate = Partial<ProfileInsert>;

// ─────────────────────────────────────────────────────────────────────────────

export interface NoticeRow {
  id: number;                         // bigserial
  title: string;
  content: string;
  category: NoticeCategory;
  attachment_url: string | null;      // Cloudinary asset URL
  is_pinned: boolean;
  created_by: string;                 // UUID FK → profiles
  created_at: string;
}

export interface NoticeInsert {
  title: string;
  content: string;
  category?: NoticeCategory;
  attachment_url?: string | null;
  is_pinned?: boolean;
  created_by: string;
}

export type NoticeUpdate = Partial<NoticeInsert>;

// ─────────────────────────────────────────────────────────────────────────────

export interface EventRow {
  id: number;
  title: string;
  description: string;
  category: EventCategory;
  banner_url: string | null;          // Cloudinary image URL
  schedule: string;                   // ISO-8601 timestamp
  venue: string;
  organizer_info: string | null;
  past_archive: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventInsert {
  title: string;
  description: string;
  category: EventCategory;
  banner_url?: string | null;
  schedule: string;
  venue: string;
  organizer_info?: string | null;
  past_archive?: boolean;
}

export type EventUpdate = Partial<EventInsert>;

// ─────────────────────────────────────────────────────────────────────────────

export interface EventRegistrationRow {
  id: number;
  event_id: number;
  user_id: string;                    // UUID FK → profiles
  registered_at: string;
}

export interface EventRegistrationInsert {
  event_id: number;
  user_id: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface GrievanceRow {
  id: number;
  ticket_number: string;
  is_anonymous: boolean;
  user_id: string | null;             // NULL for anonymous submissions
  category: string;
  title: string;
  description: string;
  attachment_url: string | null;      // Cloudinary asset URL
  status: GrievanceStatus;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrievanceInsert {
  ticket_number: string;
  is_anonymous?: boolean;
  user_id?: string | null;
  category: string;
  title: string;
  description: string;
  attachment_url?: string | null;
  status?: GrievanceStatus;
}

export type GrievanceUpdate = Partial<GrievanceInsert> & {
  admin_response?: string | null;
  status?: GrievanceStatus;
};

// ─────────────────────────────────────────────────────────────────────────────

export interface LibraryResourceRow {
  id: number;
  title: string;
  category: LibraryCategory;
  file_url: string;                   // Cloudinary delivery URL
  file_size_bytes: number | null;
  mime_type: string | null;
  upload_by: string;                  // UUID FK → profiles
  created_at: string;
}

export interface LibraryResourceInsert {
  title: string;
  category: LibraryCategory;
  file_url: string;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  upload_by: string;
}

// ─────────────────────────────────────────────────────────────────────────────

/** Shape of a single attendance entry inside meetings.attendance JSONB */
export interface AttendeeRecord {
  user_id: string;
  name: string;
  present: boolean;
}

/** Shape of a single action item inside meetings.action_items JSONB */
export interface ActionItem {
  item: string;
  assignee: string;
  due_date: string;                   // ISO-8601 date string
  completed: boolean;
}

export interface MeetingRow {
  id: number;
  title: string;
  notice_date: string;                // ISO-8601 date
  agenda: string | null;
  attendance: AttendeeRecord[];
  minutes_of_meeting: string | null;
  action_items: ActionItem[];
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeetingInsert {
  title: string;
  notice_date: string;
  agenda?: string | null;
  attendance?: AttendeeRecord[];
  minutes_of_meeting?: string | null;
  action_items?: ActionItem[];
  attachment_url?: string | null;
}

export type MeetingUpdate = Partial<MeetingInsert>;

// ─── Database type bag (consumed by Supabase client generics) ─────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      notices: {
        Row: NoticeRow;
        Insert: NoticeInsert;
        Update: NoticeUpdate;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: EventInsert;
        Update: EventUpdate;
        Relationships: [];
      };
      event_registrations: {
        Row: EventRegistrationRow;
        Insert: EventRegistrationInsert;
        Update: Partial<EventRegistrationInsert>;
        Relationships: [];
      };
      grievances: {
        Row: GrievanceRow;
        Insert: GrievanceInsert;
        Update: GrievanceUpdate;
        Relationships: [];
      };
      library_resources: {
        Row: LibraryResourceRow;
        Insert: LibraryResourceInsert;
        Update: Partial<LibraryResourceInsert>;
        Relationships: [];
      };
      meetings: {
        Row: MeetingRow;
        Insert: MeetingInsert;
        Update: MeetingUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: {
      user_role: UserRole;
      membership_status: MembershipStatus;
      grievance_status: GrievanceStatus;
      notice_category: NoticeCategory;
      event_category: EventCategory;
      library_category: LibraryCategory;
    };
  };
}

