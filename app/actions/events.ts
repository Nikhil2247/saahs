"use server";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function toggleEventRegistration(eventId: number) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please log in to register for events." };
  }

  const supabase = createSupabaseAdminClient();

  // Check if already registered
  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (existing) {
    // Unregister
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("id", existing.id);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/student/events");
    return { success: true, registered: false };
  } else {
    // Register
    const { error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        user_id: session.userId,
      } as any);

    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/student/events");
    return { success: true, registered: true };
  }
}
