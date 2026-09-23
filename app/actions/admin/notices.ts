"use server"

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { getSession } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import { uploadToMinio } from "@/src/lib/minio"
import type { NoticeCategory, NoticeSection } from "@/types/database"

// ─── General Notices ──────────────────────────────────────────────────────────

export async function createNotice(formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const title    = (formData.get("title") as string)?.trim();
  const content  = formData.get("content") as string;
  const category = formData.get("category") as string;
  const section  = (formData.get("section") as NoticeSection) || "General";
  const is_pinned = formData.get("is_pinned") === "true";

  // Enforce title length to satisfy DB check constraint (5–255 chars)
  if (!title || title.length < 5) {
    return { success: false, error: "Title must be at least 5 characters long." };
  }
  if (title.length > 255) {
    return { success: false, error: "Title must not exceed 255 characters." };
  }

  // Handle image upload for Letters & Minutes section
  let image_url: string | null = null;
  const imageFile = formData.get("image_file") as File | null;
  if (imageFile && imageFile.size > 0) {
    try {
      image_url = await uploadToMinio(imageFile, "notices");
    } catch (err: any) {
      return { success: false, error: `Image upload failed: ${err.message}` };
    }
  }

  // Handle document_type for Documents section
  const document_type = formData.get("document_type") as string | null;

  const { error } = await supabase.from("notices").insert({
    title,
    content: content?.trim() || "-",
    category: (category as NoticeCategory) || "General",
    section,
    is_pinned,
    image_url,
    document_type: document_type || null,
    created_by: session.userId,
  } as any);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/notices");
  revalidatePath("/");
  revalidatePath("/notices");
  return { success: true };
}

export async function updateNotice(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const title    = (formData.get("title") as string)?.trim();
  const content  = formData.get("content") as string;
  const category = formData.get("category") as string;
  const section  = (formData.get("section") as NoticeSection) || "General";
  const is_pinned = formData.get("is_pinned") === "true";
  const document_type = formData.get("document_type") as string | null;

  // Enforce title length to satisfy DB check constraint (5–255 chars)
  if (!title || title.length < 5) {
    return { success: false, error: "Title must be at least 5 characters long." };
  }
  if (title.length > 255) {
    return { success: false, error: "Title must not exceed 255 characters." };
  }

  // Handle image upload for Letters & Minutes section
  let image_url: string | null = (formData.get("existing_image_url") as string) || null;
  const imageFile = formData.get("image_file") as File | null;
  if (imageFile && imageFile.size > 0) {
    try {
      image_url = await uploadToMinio(imageFile, "notices");
    } catch (err: any) {
      return { success: false, error: `Image upload failed: ${err.message}` };
    }
  }

  const { error } = await supabase.from("notices").update({
    title,
    content: content?.trim() || "-",
    category: category as NoticeCategory,
    section,
    is_pinned,
    image_url,
    document_type: document_type || null,
  } as any).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/notices");
  revalidatePath("/");
  revalidatePath("/notices");
  return { success: true };
}

export async function deleteNotice(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("notices").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/notices");
  revalidatePath("/");
  revalidatePath("/notices");
  return { success: true };
}
