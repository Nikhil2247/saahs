"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import type { ActionResult } from "@/app/actions/auth";

const PHONE_REGEX = /^\+?[0-9\s\-]{7,15}$/;
const BATCH_YEAR_REGEX = /^\d{4}$/;

export interface UpdateProfileData {
  full_name: string;
  phone_number: string;
  course: string;
  batch_year: string;
  institution_name?: string;
}

export async function updateProfile(
  data: UpdateProfileData
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be signed in to update your profile." };
  }

  if (!data.full_name?.trim() || data.full_name.trim().length < 2)
    return { success: false, error: "Full name must be at least 2 characters." };
  if (!PHONE_REGEX.test(data.phone_number))
    return { success: false, error: "Please enter a valid phone number (7–15 digits)." };
  if (!data.course?.trim())
    return { success: false, error: "Course / discipline is required." };
  if (!BATCH_YEAR_REGEX.test(data.batch_year))
    return { success: false, error: "Batch year must be a 4-digit year, e.g. 2023." };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name.trim(),
      phone_number: data.phone_number.trim(),
      course: data.course.trim(),
      batch_year: data.batch_year.trim(),
      ...(data.institution_name !== undefined
        ? { institution: data.institution_name.trim() || null }
        : {}),
    } as any)
    .eq("id", session.userId);

  if (error) {
    console.error("[profile/update]", error);
    return { success: false, error: "Failed to update profile. Please try again." };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
