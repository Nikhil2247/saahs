"use server"

import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateMemberRole(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  // Ideally, verify if the acting user is an Admin
  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminCheck?.role !== "Admin") {
    return { success: false, error: "Only admins can change roles" };
  }

  const role = formData.get("role") as string;

  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/memberships");
  return { success: true };
}

export async function deleteMember(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminCheck?.role !== "Admin") {
    return { success: false, error: "Only admins can delete users" };
  }

  // Warning: This only deletes the profile record, not the Supabase Auth user.
  // Full deletion would require Supabase Admin API.
  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/memberships");
  return { success: true };
}
