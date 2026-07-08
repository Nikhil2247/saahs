/**
 * src/app/actions/grievances.ts
 *
 * Server Actions — Grievance / Help-Desk Ticket Management
 *
 * Covers:
 *  - `createGrievance()`:       Submit a new grievance (authenticated or anonymous).
 *  - `respondToGrievance()`:    Admin action to update status and post a response.
 *  - `listGrievances()`:        Lists grievances visible to the caller.
 *  - `getGrievanceByTicket()`:  Fetch a single ticket by its ticket_number.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { ActionResult } from "./auth";
import type { GrievanceRow, GrievanceStatus, UserRole } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Roles permitted to respond to grievances */
const ADMIN_ROLES: UserRole[] = ["President", "Vice President", "General Secretary"];

/** Maximum characters for grievance description (safe truncation limit) */
const DESC_MAX_LENGTH = 3000;
const TITLE_MAX_LENGTH = 255;

/** Valid status transitions for admin responses */
const VALID_NEXT_STATUSES: GrievanceStatus[] = [
  "Under Review",
  "In Progress",
  "Resolved",
  "Closed",
];

// ─── Ticket number generator ──────────────────────────────────────────────────

/**
 * Generates a short, human-readable unique ticket number.
 * Format: "GRV-XXXXXXXX" where X is uppercase alphanumeric (base-36).
 * Collision probability is negligible for portal-scale volumes.
 */
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();         // time component
  const random = Math.random().toString(36).slice(2, 6).toUpperCase(); // 4-char random
  return `GRV-${timestamp.slice(-4)}${random}`;                   // e.g. GRV-K4F7X9A2
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateGrievanceInput {
  category: string;
  title: string;
  description: string;
  is_anonymous?: boolean;
  attachment_url?: string | null;
}

export interface RespondToGrievanceInput {
  ticket_number: string;
  response_text: string;
  next_status: GrievanceStatus;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Creates a new grievance ticket.
 *
 * - If `is_anonymous` is true, the `user_id` field is NOT stored (privacy-safe).
 * - All text inputs are safely truncated to their DB-enforced max lengths.
 * - A unique, short ticket number is generated server-side.
 * - Both authenticated and unauthenticated users may submit.
 */
export async function createGrievance(
  input: CreateGrievanceInput
): Promise<ActionResult<{ ticket_number: string }>> {
  // ── Input validation ───────────────────────────────────────────────────────

  const category = input.category?.trim();
  const title    = input.title?.trim().slice(0, TITLE_MAX_LENGTH);
  const description = input.description?.trim().slice(0, DESC_MAX_LENGTH);
  const isAnonymous = Boolean(input.is_anonymous);

  if (!category || category.length < 2) {
    return { success: false, error: "Please select a valid category." };
  }
  if (!title || title.length < 5) {
    return { success: false, error: "Title must be at least 5 characters." };
  }
  if (!description || description.length < 10) {
    return { success: false, error: "Description must be at least 10 characters." };
  }

  // ── Auth (optional) ────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Determine user_id: null if anonymous or not signed in
  const userId: string | null = isAnonymous ? null : (user?.id ?? null);

  // ── Generate unique ticket number (retry on collision) ────────────────────
  let ticketNumber = generateTicketNumber();
  let attempts = 0;

  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("grievances")
      .select("id")
      .eq("ticket_number", ticketNumber)
      .maybeSingle();

    if (!existing) break; // No collision — proceed
    ticketNumber = generateTicketNumber();
    attempts++;
  }

  // ── Persist ────────────────────────────────────────────────────────────────
  const { data, error: insertError } = await supabase
    .from("grievances")
    .insert({
      ticket_number:  ticketNumber,
      is_anonymous:   isAnonymous,
      user_id:        userId,
      category,
      title,
      description,
      attachment_url: input.attachment_url ?? null,
      status:         "Submitted",
    })
    .select("ticket_number")
    .single();

  if (insertError) {
    console.error("[grievances/create] Insert error:", insertError);
    return { success: false, error: "Failed to submit grievance. Please try again." };
  }

  revalidatePath("/dashboard/admin/grievances");
  revalidatePath("/help-desk");

  return { success: true, data: { ticket_number: data.ticket_number } };
}

/**
 * Admin action: post a response to a grievance and advance its status.
 *
 * @param input.ticket_number  - The grievance's unique ticket reference.
 * @param input.response_text  - The committee's response (max 3 000 chars).
 * @param input.next_status    - The new lifecycle status.
 */
export async function respondToGrievance(
  input: RespondToGrievanceInput
): Promise<ActionResult> {
  // ── Validate ───────────────────────────────────────────────────────────────
  const { ticket_number, next_status } = input;
  const response_text = input.response_text?.trim().slice(0, DESC_MAX_LENGTH);

  if (!ticket_number) {
    return { success: false, error: "Ticket number is required." };
  }
  if (!response_text || response_text.length < 5) {
    return { success: false, error: "Response must be at least 5 characters." };
  }
  if (!VALID_NEXT_STATUSES.includes(next_status)) {
    return { success: false, error: `Invalid status: "${next_status}".` };
  }

  // ── Auth & authorisation ───────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!adminProfile || !ADMIN_ROLES.includes(adminProfile.role as UserRole)) {
    return { success: false, error: "You do not have permission to respond to grievances." };
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from("grievances")
    .update({
      admin_response: response_text,
      status: next_status,
    })
    .eq("ticket_number", ticket_number);

  if (updateError) {
    console.error("[grievances/respond] Update error:", updateError);
    return { success: false, error: "Failed to submit response. Please try again." };
  }

  revalidatePath("/dashboard/admin/grievances");
  revalidatePath("/help-desk");

  return { success: true };
}

/**
 * Returns grievances visible to the calling user:
 *  - Admins: all grievances.
 *  - Authenticated non-admins: only their own non-anonymous grievances.
 *  - Unauthenticated: empty list (anonymous submissions are one-way).
 */
export async function listGrievances(): Promise<ActionResult<GrievanceRow[]>> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: true, data: [] };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = ADMIN_ROLES.includes(profile?.role as UserRole);

  let query = supabase.from("grievances").select("*").order("created_at", { ascending: false });

  if (!isAdmin) {
    // Non-admins only see their own non-anonymous tickets
    query = query.eq("user_id", user.id).eq("is_anonymous", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[grievances/list] Query error:", error);
    return { success: false, error: "Failed to load grievances." };
  }

  return { success: true, data: data ?? [] };
}

/**
 * Fetch a single grievance by ticket number.
 * Access rules: same as listGrievances — admins see all; others see their own only.
 */
export async function getGrievanceByTicket(
  ticketNumber: string
): Promise<ActionResult<GrievanceRow>> {
  if (!ticketNumber) {
    return { success: false, error: "Ticket number is required." };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("grievances")
    .select("*")
    .eq("ticket_number", ticketNumber)
    .single();

  if (error || !data) {
    return { success: false, error: "Grievance not found." };
  }

  // Extra access check in the action layer (belt-and-suspenders alongside RLS)
  if (!data.is_anonymous && data.user_id !== user?.id) {
    const { data: admin } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id ?? "")
      .single();

    if (!ADMIN_ROLES.includes(admin?.role as UserRole)) {
      return { success: false, error: "Access denied." };
    }
  }

  return { success: true, data };
}
