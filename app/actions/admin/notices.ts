"use server"

import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createNotice(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;
  const attachment_url = formData.get("attachment_url") as string || null;
  const is_pinned = formData.get("is_pinned") === "true";

  const { error } = await supabase.from("notices").insert({
    title,
    content,
    category,
    attachment_url,
    is_pinned,
    created_by: user.id
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/notices");
  revalidatePath("/");
  revalidatePath("/notices");
  return { success: true };
}

export async function updateNotice(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;
  const attachment_url = formData.get("attachment_url") as string || null;
  const is_pinned = formData.get("is_pinned") === "true";

  const { error } = await supabase.from("notices").update({
    title,
    content,
    category,
    attachment_url,
    is_pinned,
  }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/notices");
  revalidatePath("/");
  revalidatePath("/notices");
  return { success: true };
}

export async function deleteNotice(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("notices").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/notices");
  revalidatePath("/");
  revalidatePath("/notices");
  return { success: true };
}
