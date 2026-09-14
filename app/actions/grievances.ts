"use server"

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { getSession } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import type { GrievanceStatus } from "@/types/database"

export async function submitGrievance(formData: FormData) {
  const title = ((formData.get("subject") as string) ?? "").trim();
  const category = ((formData.get("category") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const isAnonymous = formData.get("anonymous") === "true";

  if (title.length < 5 || title.length > 255) {
    return { success: false, error: "Subject must be between 5 and 255 characters." };
  }
  if (description.length < 10) {
    return { success: false, error: "Description must be at least 10 characters." };
  }
  if (!category) {
    return { success: false, error: "Category is required." };
  }

  const supabase = createSupabaseAdminClient();

  let userId: string | null = null;
  if (!isAnonymous) {
    const session = await getSession();
    userId = session?.userId ?? null;
  }

  const ticket_number = "GRV-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  const { error } = await supabase
    .from("grievances")
    .insert({
      ticket_number,
      title,
      category,
      description,
      is_anonymous: isAnonymous,
      user_id: userId,
      status: "Submitted",
    });

  if (error) {
    console.error("Grievance insertion error:", error);
    return { success: false, error: "Failed to submit grievance. Please try again." };
  }

  revalidatePath("/dashboard/admin/grievances");
  revalidatePath("/help-desk");

  return { success: true, ticket_number };
}

export async function updateGrievanceStatus(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const status = formData.get("status") as GrievanceStatus;

  const { error } = await supabase.from("grievances").update({ status }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/grievances");
  return { success: true };
}

export async function deleteGrievance(id: string) {
  const session = await getSession();
  if (!session) return { success: false, error: "Unauthorized" };

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("grievances").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/grievances");
  return { success: true };
}
