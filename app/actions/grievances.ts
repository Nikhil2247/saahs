"use server"

import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitGrievance(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  
  const title = formData.get("subject") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const isAnonymous = formData.get("anonymous") === "true";
  
  let userId = null;
  if (!isAnonymous) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;
  }

  const ticket_number = "GRV-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  const { data, error } = await supabase
    .from("grievances")
    .insert({
      ticket_number,
      title,
      category,
      description,
      is_anonymous: isAnonymous,
      user_id: userId,
      status: "Open"
    });

  if (error) {
    console.error("Grievance insertion error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/admin/grievances");
  revalidatePath("/help-desk");
  
  return { success: true, ticket_number };
}

export async function updateGrievanceStatus(id: string, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const status = formData.get("status") as string;

  const { error } = await supabase.from("grievances").update({ status }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/grievances");
  return { success: true };
}

export async function deleteGrievance(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("grievances").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/grievances");
  return { success: true };
}

