"use server";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

const ADMIN_ROLES = new Set([
  "Executive Body Member",
  "Governing Body Member",
  "Literary Secretary",
  "Treasurer",
  "General Secretary",
  "Vice President",
  "President",
]);

async function verifyAdmin() {
  const session = await getSession();
  if (!session) return { authorized: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.userId)
    .single();

  if (!profile || !ADMIN_ROLES.has(profile.role)) {
    return { authorized: false, error: "Forbidden: Admin access required" };
  }

  return { authorized: true, userId: session.userId };
}

export async function createMeeting(formData: FormData) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { success: false, error: auth.error };

  const title = (formData.get("title") as string)?.trim();
  const notice_date = formData.get("notice_date") as string;
  const agenda = (formData.get("agenda") as string)?.trim() || null;
  const minutes_of_meeting = (formData.get("minutes_of_meeting") as string)?.trim() || null;

  if (!title || !notice_date) {
    return { success: false, error: "Title and notice date are required." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("meetings").insert({
    title,
    notice_date,
    agenda,
    minutes_of_meeting,
    attendance: [],
    action_items: [],
  } as any);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/admin/meetings");
  return { success: true };
}

export async function updateMeeting(id: number, formData: FormData) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { success: false, error: auth.error };

  const title = (formData.get("title") as string)?.trim();
  const notice_date = formData.get("notice_date") as string;
  const agenda = (formData.get("agenda") as string)?.trim() || null;
  const minutes_of_meeting = (formData.get("minutes_of_meeting") as string)?.trim() || null;

  if (!title || !notice_date) {
    return { success: false, error: "Title and notice date are required." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("meetings")
    .update({
      title,
      notice_date,
      agenda,
      minutes_of_meeting,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/admin/meetings");
  return { success: true };
}

export async function deleteMeeting(id: number) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { success: false, error: auth.error };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("meetings").delete().eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/admin/meetings");
  return { success: true };
}
