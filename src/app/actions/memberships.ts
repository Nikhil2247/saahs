/**
 * src/app/actions/memberships.ts
 *
 * Server Actions — Membership Management
 *
 * Covers:
 *  - `applyForMembership()`:   A student submits a membership application.
 *  - `reviewMembership()`:     An admin approves or rejects an application.
 *  - `getMyMembershipStatus()`: Returns the caller's current membership status.
 *  - `listPendingMemberships()`: Admin-only: list all Pending profiles.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { ActionResult } from "./auth";
import type { MembershipStatus, ProfileRow, UserRole } from "@/types/database";

/** Roles permitted to approve/reject membership applications */
const ADMIN_ROLES: UserRole[] = ["President", "Vice President", "General Secretary"];

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Allows an authenticated, onboarded user to apply for SAAHS membership.
 *
 * Business rules:
 *  - A user can only apply if their current membership_status is 'Pending'
 *    (prevents duplicate applications).
 *  - The profile row already exists (created by the auth trigger).
 */
export async function applyForMembership(): Promise<ActionResult> {
  const supabase = await createSupabaseServerClient();

  // 1. Authenticate caller
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to apply for membership." };
  }

  // 2. Fetch current profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("membership_status, onboarding_complete")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Could not retrieve your profile. Please try again." };
  }

  // 3. Guard: must have completed onboarding
  if (!profile.onboarding_complete) {
    return {
      success: false,
      error: "Please complete your profile setup before applying for membership.",
    };
  }

  // 4. Guard: prevent duplicate / re-application for already approved members
  if (profile.membership_status === "Approved") {
    return { success: false, error: "You are already an approved SAAHS member." };
  }

  if (profile.membership_status === "Rejected") {
    // Allow re-application after rejection by resetting to Pending
  }

  // 5. Set (or reset) to Pending
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ membership_status: "Pending" })
    .eq("id", user.id);

  if (updateError) {
    console.error("[memberships/apply] Update error:", updateError);
    return { success: false, error: "Failed to submit membership application." };
  }

  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/admin/memberships");

  return { success: true };
}

/**
 * Admin action: approve or reject a membership application.
 *
 * On Approval: sets membership_status = 'Approved' and upgrades the role to
 *              'SAAHS Member' (if the user is currently 'Public User').
 * On Rejection: sets membership_status = 'Rejected' and keeps role as-is.
 *
 * @param profileId  - UUID of the profile being reviewed.
 * @param newStatus  - The decision: 'Approved' or 'Rejected'.
 */
export async function reviewMembership(
  profileId: string,
  newStatus: Extract<MembershipStatus, "Approved" | "Rejected">
): Promise<ActionResult> {
  if (!profileId) {
    return { success: false, error: "Profile ID is required." };
  }

  const supabase = await createSupabaseServerClient();

  // 1. Authenticate and authorise caller
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminError || !adminProfile) {
    return { success: false, error: "Could not verify your permissions." };
  }

  if (!ADMIN_ROLES.includes(adminProfile.role as UserRole)) {
    return {
      success: false,
      error: "You do not have permission to review membership applications.",
    };
  }

  // 2. Build update payload
  const updatePayload: {
    membership_status: MembershipStatus;
    role?: UserRole;
  } = { membership_status: newStatus };

  if (newStatus === "Approved") {
    // Fetch the applicant's current role to determine if we should upgrade
    const { data: applicant } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", profileId)
      .single();

    if (applicant?.role === "Public User") {
      updatePayload.role = "SAAHS Member";
    }
  }

  // 3. Persist the decision
  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", profileId);

  if (updateError) {
    console.error("[memberships/review] Update error:", updateError);
    return { success: false, error: "Failed to update membership status." };
  }

  revalidatePath("/dashboard/admin/memberships");
  revalidatePath("/dashboard/student");

  return { success: true };
}

/**
 * Returns the current user's membership status.
 */
export async function getMyMembershipStatus(): Promise<
  ActionResult<{ status: MembershipStatus; role: UserRole }>
> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("membership_status, role")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return { success: false, error: "Could not fetch membership status." };
  }

  return {
    success: true,
    data: { status: data.membership_status, role: data.role },
  };
}

/**
 * Admin-only: list all profiles with membership_status = 'Pending'.
 */
export async function listPendingMemberships(): Promise<
  ActionResult<Pick<ProfileRow, "id" | "full_name" | "email" | "department" | "course" | "batch_year" | "roll_number" | "created_at">[]>
> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: admin } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!admin || !ADMIN_ROLES.includes(admin.role as UserRole)) {
    return { success: false, error: "Insufficient permissions." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, department, course, batch_year, roll_number, created_at")
    .eq("membership_status", "Pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[memberships/list] Query error:", error);
    return { success: false, error: "Failed to load pending memberships." };
  }

  return { success: true, data: data ?? [] };
}
