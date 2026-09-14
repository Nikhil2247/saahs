/**
 * app/actions/admin/institutions.ts
 *
 * Server Actions — Institution Management
 *
 * `institutions` backs the "Institution" dropdown shown on the onboarding
 * form. Any authenticated user may read the active list; only admins may
 * add/edit/deactivate entries.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import type { ActionResult } from "@/app/actions/auth";
import type { InstitutionRow, UserRole } from "@/types/database";

const ADMIN_ROLES: UserRole[] = ["President", "Vice President", "General Secretary"];

async function requireAdmin(): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Authentication required." };

  const supabase = createSupabaseAdminClient();
  const { data: admin } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!admin || !ADMIN_ROLES.includes(admin.role as UserRole)) {
    return { ok: false, error: "You do not have permission to manage institutions." };
  }
  return { ok: true };
}

/** Returns active institutions, for the onboarding dropdown. Any signed-in user. */
export async function getActiveInstitutions(): Promise<ActionResult<InstitutionRow[]>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Authentication required." };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[institutions/getActive] Query error:", error);
    return { success: false, error: "Failed to load institutions." };
  }

  return { success: true, data: data ?? [] };
}

/** Admin-only: full list, including inactive entries. */
export async function listInstitutions(): Promise<ActionResult<InstitutionRow[]>> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[institutions/list] Query error:", error);
    return { success: false, error: "Failed to load institutions." };
  }

  return { success: true, data: data ?? [] };
}

export async function createInstitution(name: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const trimmed = name?.trim();
  if (!trimmed) return { success: false, error: "Institution name is required." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("institutions").insert({ name: trimmed });

  if (error) {
    console.error("[institutions/create] Insert error:", error);
    return { success: false, error: error.message.includes("duplicate") ? "That institution already exists." : "Failed to add institution." };
  }

  revalidatePath("/dashboard/admin/institutions");
  return { success: true };
}

export async function updateInstitution(
  id: number,
  data: { name?: string; is_active?: boolean }
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("institutions")
    .update({
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
    })
    .eq("id", id);

  if (error) {
    console.error("[institutions/update] Update error:", error);
    return { success: false, error: "Failed to update institution." };
  }

  revalidatePath("/dashboard/admin/institutions");
  return { success: true };
}

export async function deleteInstitution(id: number): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.ok) return { success: false, error: admin.error };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("institutions").delete().eq("id", id);

  if (error) {
    console.error("[institutions/delete] Delete error:", error);
    return { success: false, error: "Failed to delete institution." };
  }

  revalidatePath("/dashboard/admin/institutions");
  return { success: true };
}
