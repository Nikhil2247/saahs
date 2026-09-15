"use server"

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { getSession } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import { uploadToMinio } from "@/src/lib/minio"
import type { LibraryCategory } from "@/types/database"

const AUTHORIZED_ROLES = [
  "Faculty", "Literary Secretary", "General Secretary", "Vice President", "President"
]

// ─── Folders ──────────────────────────────────────────────────────────────────

export async function createFolder(formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  // Role check
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.userId).single();
  if (!profile || !AUTHORIZED_ROLES.includes((profile as any).role)) {
    return { success: false, error: "Insufficient permissions to create folders." };
  }

  const name     = formData.get("name") as string;
  const course   = formData.get("course") as string;
  const semester = formData.get("semester") as string;

  if (!name?.trim() || !course?.trim() || !semester?.trim()) {
    return { success: false, error: "Name, course, and semester are required." };
  }

  const { error } = await supabase.from("lib_folders").insert({
    name: name.trim(),
    course: course.trim(),
    semester: semester.trim(),
    created_by: session.userId,
  } as any);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/library");
  revalidatePath("/e-library");
  return { success: true };
}

export async function deleteFolder(id: number) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.userId).single();
  if (!profile || !AUTHORIZED_ROLES.includes((profile as any).role)) {
    return { success: false, error: "Insufficient permissions." };
  }

  const { error } = await supabase.from("lib_folders").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/library");
  return { success: true };
}

// ─── Resources ────────────────────────────────────────────────────────────────

export async function createResource(formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const title     = formData.get("title") as string;
  const folder_id = formData.get("folder_id") ? Number(formData.get("folder_id")) : null;
  const course    = formData.get("course") as string | null;
  const semester  = formData.get("semester") as string | null;

  const file = formData.get("file") as File;
  let file_url = "";
  if (file && file.size > 0) {
    try {
      file_url = await uploadToMinio(file, "library");
    } catch (err: any) {
      return { success: false, error: `Upload failed: ${err.message}` };
    }
  } else {
    return { success: false, error: "File is required" };
  }

  const resource_type = formData.get("resource_type") as string;
  let category: LibraryCategory = "Notes";
  if (resource_type === "E-Book") category = "Books";
  else if (resource_type === "Past Paper") category = "Previous Year Papers";
  else if (resource_type === "Notes") category = "Notes";
  else if (resource_type === "Presentation") category = "Presentations";
  else if (resource_type === "SOP") category = "SOPs";
  else if (resource_type === "Research") category = "Research Papers";
  else if (resource_type === "Other") category = "Official Documents";

  const { error } = await supabase.from("library_resources").insert({
    title: title.trim(),
    category,
    file_url,
    file_size_bytes: file.size,
    mime_type: file.type,
    upload_by: session.userId,
    folder_id,
    course: course?.trim() || null,
    semester: semester?.trim() || null,
  } as any);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/library");
  revalidatePath("/e-library");
  return { success: true };
}

export async function updateResource(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const title = formData.get("title") as string;
  const resource_type = formData.get("resource_type") as string;

  const file = formData.get("file") as File;
  let file_url = formData.get("file_url") as string;
  if (file && file.size > 0) {
    try {
      file_url = await uploadToMinio(file, "library");
    } catch (err: any) {
      return { success: false, error: `Upload failed: ${err.message}` };
    }
  }

  let category: LibraryCategory = "Notes";
  if (resource_type === "E-Book") category = "Books";
  else if (resource_type === "Past Paper") category = "Previous Year Papers";
  else if (resource_type === "Notes") category = "Notes";
  else if (resource_type === "Presentation") category = "Presentations";
  else if (resource_type === "SOP") category = "SOPs";
  else if (resource_type === "Research") category = "Research Papers";
  else if (resource_type === "Other") category = "Official Documents";

  const { error } = await supabase.from("library_resources").update({
    title: title.trim(),
    category,
    file_url,
  } as any).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/library");
  return { success: true };
}

export async function deleteResource(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("library_resources").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/library");
  return { success: true };
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

export async function getFolders() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("lib_folders")
    .select("*")
    .order("course")
    .order("semester")
    .order("name");
  return { data: data ?? [], error };
}

export async function getResourcesByFolder(folder_id: number) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await (supabase as any)
    .from("library_resources")
    .select("*")
    .eq("folder_id", folder_id)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
}
