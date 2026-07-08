/**
 * src/app/actions/notices.ts
 *
 * Server Actions — Notice Board Management
 *
 * Covers:
 *  - `createNotice()`:  Publish a new notice (authorized roles only).
 *  - `listNotices()`:   Public list of all notices, sorted with pinned first.
 *  - `deleteNotice()`:  Remove a notice and its optional Cloudinary attachment.
 *  - `pinNotice()`:     Toggle the pinned state of a notice.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/app/actions/_supabase";
import { destroyCloudinaryAsset } from "@/src/lib/cloudinary";
import type { ActionResult } from "@/app/actions/auth";
import type { NoticeCategory, NoticeRow, UserRole } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Roles authorized to create, update, and delete notices */
const NOTICE_ROLES: UserRole[] = [
  "Literary Secretary",
  "General Secretary",
  "Vice President",
  "President",
];

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateNoticeInput {
  title: string;
  content: string;
  category?: NoticeCategory;
  attachment_url?: string | null;  // Cloudinary URL (after client-side upload)
  is_pinned?: boolean;
}

export interface ListNoticesInput {
  category?: NoticeCategory;
  page?: number;
  page_size?: number;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Publishes a new notice.
 * The caller must hold one of the NOTICE_ROLES.
 */
export async function createNotice(
  input: CreateNoticeInput
): Promise<ActionResult<{ id: number }>> {
  // ── Validate ───────────────────────────────────────────────────────────────
  const title   = input.title?.trim();
  const content = input.content?.trim();

  if (!title || title.length < 5 || title.length > 255) {
    return { success: false, error: "Title must be between 5 and 255 characters." };
  }
  if (!content || content.length < 10) {
    return { success: false, error: "Content must be at least 10 characters." };
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !NOTICE_ROLES.includes(profile.role as UserRole)) {
    return { success: false, error: "You do not have permission to publish notices." };
  }

  // ── Insert ─────────────────────────────────────────────────────────────────
  const { data, error: insertError } = await supabase
    .from("notices")
    .insert({
      title,
      content,
      category:       input.category ?? "General",
      attachment_url: input.attachment_url ?? null,
      is_pinned:      input.is_pinned ?? false,
      created_by:     user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[notices/create] Insert error:", insertError);
    return { success: false, error: "Failed to publish notice. Please try again." };
  }

  revalidatePath("/notices");
  revalidatePath("/dashboard/admin/notices");

  return { success: true, data: { id: data.id } };
}

/**
 * Returns a paginated list of notices, pinned items first.
 * Publicly accessible — no auth required.
 */
export async function listNotices(
  input: ListNoticesInput = {}
): Promise<ActionResult<{ notices: NoticeRow[]; total: number }>> {
  const supabase = await createSupabaseServerClient();

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, input.page_size ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("notices")
    .select("*", { count: "exact" })
    // Pinned notices float to the top, then most recent
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (input.category) {
    query = query.eq("category", input.category);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[notices/list] Query error:", error);
    return { success: false, error: "Failed to load notices." };
  }

  return {
    success: true,
    data: { notices: data ?? [], total: count ?? 0 },
  };
}

/**
 * Deletes a notice and destroys its Cloudinary attachment if present.
 *
 * @param noticeId      - Database ID of the notice to delete.
 * @param cloudinaryId  - Cloudinary public_id of the attachment (optional).
 */
export async function deleteNotice(
  noticeId: number,
  cloudinaryId: string | null = null
): Promise<ActionResult> {
  if (!noticeId) {
    return { success: false, error: "Notice ID is required." };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !NOTICE_ROLES.includes(profile.role as UserRole)) {
    return { success: false, error: "Insufficient permissions to delete notices." };
  }

  // ── Delete Cloudinary asset (non-fatal) ───────────────────────────────────
  if (cloudinaryId) {
    try {
      await destroyCloudinaryAsset(cloudinaryId, "image");
    } catch (err) {
      console.warn("[notices/delete] Cloudinary asset removal failed:", err);
    }
  }

  // ── Delete database record ─────────────────────────────────────────────────
  const { error: deleteError } = await supabase
    .from("notices")
    .delete()
    .eq("id", noticeId);

  if (deleteError) {
    console.error("[notices/delete] Delete error:", deleteError);
    return { success: false, error: "Failed to delete notice." };
  }

  revalidatePath("/notices");
  revalidatePath("/dashboard/admin/notices");

  return { success: true };
}

/**
 * Toggles the `is_pinned` flag on a notice.
 *
 * @param noticeId  - Database ID of the notice.
 * @param pinned    - Desired pinned state.
 */
export async function pinNotice(
  noticeId: number,
  pinned: boolean
): Promise<ActionResult> {
  if (!noticeId) {
    return { success: false, error: "Notice ID is required." };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !NOTICE_ROLES.includes(profile.role as UserRole)) {
    return { success: false, error: "Insufficient permissions." };
  }

  const { error: updateError } = await supabase
    .from("notices")
    .update({ is_pinned: pinned })
    .eq("id", noticeId);

  if (updateError) {
    console.error("[notices/pin] Update error:", updateError);
    return { success: false, error: "Failed to update notice." };
  }

  revalidatePath("/notices");
  revalidatePath("/dashboard/admin/notices");

  return { success: true };
}
