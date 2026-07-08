"use server"

import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { uploadToMinio } from "@/src/lib/minio"

export async function createResource(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const title = formData.get("title") as string;
  const resource_type = formData.get("resource_type") as string;
  
  const file = formData.get("file") as File;
  let file_url = "";
  if (file && file.size > 0) {
    try {
      file_url = await uploadToMinio(file, 'library');
    } catch (err: any) {
      return { success: false, error: `Upload failed: ${err.message}` };
    }
  } else {
    return { success: false, error: "File is required" };
  }

  let category = 'Notes';
  if (resource_type === 'E-Book') category = 'Books';
  else if (resource_type === 'Past Paper') category = 'Previous Year Papers';
  else if (resource_type === 'Notes') category = 'Notes';
  else if (resource_type === 'Presentation') category = 'Presentations';
  else if (resource_type === 'Other') category = 'Official Documents';

  const { error } = await supabase.from("library_resources").insert({
    title,
    category,
    file_url,
    upload_by: user.id
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/library");
  return { success: true };
}

export async function updateResource(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const title = formData.get("title") as string;
  const resource_type = formData.get("resource_type") as string;
  
  const file = formData.get("file") as File;
  let file_url = formData.get("file_url") as string;
  if (file && file.size > 0) {
    try {
      file_url = await uploadToMinio(file, 'library');
    } catch (err: any) {
      return { success: false, error: `Upload failed: ${err.message}` };
    }
  }

  let category = 'Notes';
  if (resource_type === 'E-Book') category = 'Books';
  else if (resource_type === 'Past Paper') category = 'Previous Year Papers';
  else if (resource_type === 'Notes') category = 'Notes';
  else if (resource_type === 'Presentation') category = 'Presentations';
  else if (resource_type === 'Other') category = 'Official Documents';

  const { error } = await supabase.from("library_resources").update({
    title,
    category,
    file_url,
  }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/library");
  return { success: true };
}

export async function deleteResource(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("library_resources").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/library");
  return { success: true };
}
