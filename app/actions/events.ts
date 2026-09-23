"use server";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

import { SPORTS_LIST } from "@/lib/sports-constants";

export { SPORTS_LIST };

/**
 * Register an onboarded student for an event.
 * For Sports category events the form also captures sport_choices,
 * phone_number, and waiver_accepted.
 */
export async function registerForEvent(
  eventId: number,
  payload: {
    sportChoices?: string[];
    waiverAccepted?: boolean;
    isSportsEvent?: boolean;
  }
) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please log in to register for events." };
  }

  const supabase = createSupabaseAdminClient();

  // Verify onboarding is complete
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", session.userId)
    .single();

  if (!profile?.onboarding_complete) {
    return {
      success: false,
      error: "Please complete your profile onboarding before registering.",
    };
  }

  // For sports events, waiver is mandatory
  if (payload.isSportsEvent && !payload.waiverAccepted) {
    return {
      success: false,
      error: "You must accept the liability waiver to register.",
    };
  }

  if (payload.isSportsEvent && (!payload.sportChoices || payload.sportChoices.length === 0)) {
    return {
      success: false,
      error: "Please select at least one sport/event to register for.",
    };
  }

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    user_id: session.userId,
    sport_choices: payload.sportChoices ?? [],
    waiver_accepted: payload.waiverAccepted ?? false,
  } as any);

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "You are already registered for this event." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/student/events");
  return { success: true, registered: true };
}

/**
 * Cancel an existing registration.
 */
export async function cancelEventRegistration(eventId: number) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Not authenticated." };
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", session.userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/student/events");
  return { success: true, registered: false };
}

/**
 * Legacy toggle kept for backward compat with non-sports events.
 */
export async function toggleEventRegistration(eventId: number) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Please log in to register for events." };
  }

  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/student/events");
    return { success: true, registered: false };
  } else {
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      user_id: session.userId,
    } as any);
    if (error) return { success: false, error: error.message };
    revalidatePath("/dashboard/student/events");
    return { success: true, registered: true };
  }
}
