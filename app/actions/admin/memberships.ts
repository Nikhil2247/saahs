"use server"

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { getSession } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import type { UserRole } from "@/types/database"

/** Roles permitted to change member roles / remove members. */
const ADMIN_ROLES: UserRole[] = ["President", "Vice President", "General Secretary"];

export async function updateMemberRole(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();
  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!adminCheck || !ADMIN_ROLES.includes(adminCheck.role as UserRole)) {
    return { success: false, error: "Only admins can change roles" };
  }

  const role = formData.get("role") as string;

  const { error } = await supabase.from("profiles").update({ role: role as UserRole }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/memberships");
  return { success: true };
}

export async function deleteMember(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();
  const { data: adminCheck } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!adminCheck || !ADMIN_ROLES.includes(adminCheck.role as UserRole)) {
    return { success: false, error: "Only admins can delete users" };
  }

  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/memberships");
  return { success: true };
}
