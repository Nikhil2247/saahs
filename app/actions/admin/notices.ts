"use server"

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { getSession } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import type { NoticeCategory } from "@/types/database"

export async function createNotice(formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;
  const is_pinned = formData.get("is_pinned") === "true";

  const { error } = await supabase.from("notices").insert({
    title,
    content,
    category: category as NoticeCategory,
    is_pinned,
    created_by: session.userId,
  });

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

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const category = formData.get("category") as string;
  const is_pinned = formData.get("is_pinned") === "true";

  const { error } = await supabase.from("notices").update({
    title,
    content,
    category: category as NoticeCategory,
    is_pinned,
  }).eq("id", id);

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
