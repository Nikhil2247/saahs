/**
 * src/app/actions/library.ts
 *
 * Server Actions — E-Library Resource Management
 *
 * Covers:
 *  - `createLibraryResource()`: Upload a resource metadata record after the
 *    file has been uploaded directly to Cloudinary client-side.
 *  - `listLibraryResources()`:  Paginated / filtered resource listing.
 *  - `deleteLibraryResource()`: Remove a resource record (and optionally its
 *    Cloudinary asset via the admin API).
 */

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/app/actions/_supabase";
import { destroyCloudinaryAsset } from "@/src/lib/cloudinary";
import type { ActionResult } from "@/app/actions/auth";
import type { LibraryCategory, LibraryResourceRow, UserRole } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Roles that may upload resources to the library */
const UPLOAD_ROLES: UserRole[] = [
  "Literary Secretary",
  "General Secretary",
  "Vice President",
  "President",
];

/** Roles that may delete resources from the library */
const DELETE_ROLES: UserRole[] = UPLOAD_ROLES;

/** Roles that may browse the library (approved members and above) */
const READ_ROLES: UserRole[] = [
  "SAAHS Member",
  "Executive Body Member",
  "Governing Body Member",
  "Literary Secretary",
  "Treasurer",
  "General Secretary",
  "Vice President",
  "President",
];

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateLibraryResourceInput {
  title: string;
  category: LibraryCategory;
  file_url: string;           // Cloudinary delivery URL returned after upload
  file_size_bytes?: number;
  mime_type?: string;
}

export interface ListLibraryResourcesInput {
  category?: LibraryCategory;
  page?: number;              // 1-indexed; defaults to 1
  page_size?: number;         // defaults to 20
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Saves a new library resource record.
 *
 * The file has already been uploaded directly to Cloudinary from the client.
 * This action saves the metadata record in Supabase.
 */
export async function createLibraryResource(
  input: CreateLibraryResourceInput
): Promise<ActionResult<{ id: number }>> {
  // ── Validate ───────────────────────────────────────────────────────────────
  const title = input.title?.trim();
  if (!title || title.length < 3) {
    return { success: false, error: "Title must be at least 3 characters." };
  }
  if (!input.category) {
    return { success: false, error: "Category is required." };
  }
  if (!input.file_url) {
    return { success: false, error: "File URL is required (upload the file first)." };
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

  if (!profile || !UPLOAD_ROLES.includes(profile.role as UserRole)) {
    return { success: false, error: "You do not have permission to upload library resources." };
  }

  // ── Insert ─────────────────────────────────────────────────────────────────
  const { data, error: insertError } = await supabase
    .from("library_resources")
    .insert({
      title,
      category:        input.category,
      file_url:        input.file_url,
      file_size_bytes: input.file_size_bytes ?? null,
      mime_type:       input.mime_type ?? null,
      upload_by:       user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("[library/create] Insert error:", insertError);
    return { success: false, error: "Failed to save resource. Please try again." };
  }

  revalidatePath("/e-library");
  revalidatePath("/dashboard/admin/library");

  return { success: true, data: { id: data.id } };
}

/**
 * Lists library resources with optional category filter and pagination.
 * Accessible to approved SAAHS members and above.
 */
export async function listLibraryResources(
  input: ListLibraryResourcesInput = {}
): Promise<ActionResult<{ resources: LibraryResourceRow[]; total: number }>> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "You must be signed in to browse the library." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !READ_ROLES.includes(profile.role as UserRole)) {
    return {
      success: false,
      error: "Library access is restricted to approved SAAHS members.",
    };
  }

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, input.page_size ?? 20));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("library_resources")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (input.category) {
    query = query.eq("category", input.category);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[library/list] Query error:", error);
    return { success: false, error: "Failed to load library resources." };
  }

  return {
    success: true,
    data: { resources: data ?? [], total: count ?? 0 },
  };
}

/**
 * Deletes a library resource record and destroys its Cloudinary asset.
 *
 * @param resourceId      - Database ID of the resource to delete.
 * @param cloudinaryId    - Cloudinary public_id of the asset to destroy.
 *                          Pass null to skip asset deletion (e.g., external URL).
 */
export async function deleteLibraryResource(
  resourceId: number,
  cloudinaryId: string | null = null
): Promise<ActionResult> {
  if (!resourceId) {
    return { success: false, error: "Resource ID is required." };
  }

  const supabase = await createSupabaseServerClient();

  // ── Auth & authorisation ───────────────────────────────────────────────────
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

  if (!profile || !DELETE_ROLES.includes(profile.role as UserRole)) {
    return { success: false, error: "Insufficient permissions to delete library resources." };
  }

  // ── Delete Cloudinary asset (non-fatal if it fails) ───────────────────────
  if (cloudinaryId) {
    try {
      await destroyCloudinaryAsset(cloudinaryId, "raw");
    } catch (err) {
      console.warn("[library/delete] Cloudinary asset removal failed:", err);
      // Continue — the DB record will still be removed
    }
  }

  // ── Delete database record ─────────────────────────────────────────────────
  const { error: deleteError } = await supabase
    .from("library_resources")
    .delete()
    .eq("id", resourceId);

  if (deleteError) {
    console.error("[library/delete] Delete error:", deleteError);
    return { success: false, error: "Failed to delete resource." };
  }

  revalidatePath("/e-library");
  revalidatePath("/dashboard/admin/library");

  return { success: true };
}
