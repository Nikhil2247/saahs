/**
 * src/app/actions/auth.ts
 *
 * Server Actions — Authentication & Onboarding
 *
 * Covers:
 *  - `signInWithGoogle()`:  Initiates Google OAuth flow via Supabase.
 *  - `signOut()`:           Destroys the session and redirects to root.
 *  - `completeOnboarding()`: Saves first-time user metadata and marks
 *                            the profile as onboarding_complete = true.
 *  - `getAuthenticatedUser()`: Helper to retrieve the current user + profile.
 */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import type { ProfileUpdate } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingFormData {
  full_name: string;
  phone_number: string;
  department: string;
  course: string;
  batch_year: string;
  roll_number: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const PHONE_REGEX = /^\+?[0-9\s\-]{7,15}$/;
const BATCH_YEAR_REGEX = /^\d{4}$/;

function validateOnboardingData(
  data: OnboardingFormData
): string | null {
  if (!data.full_name || data.full_name.trim().length < 2) {
    return "Full name must be at least 2 characters.";
  }
  if (!PHONE_REGEX.test(data.phone_number)) {
    return "Please enter a valid phone number (7–15 digits).";
  }
  if (!data.department || data.department.trim().length < 2) {
    return "Department is required.";
  }
  if (!data.course || data.course.trim().length < 2) {
    return "Course is required.";
  }
  if (!BATCH_YEAR_REGEX.test(data.batch_year)) {
    return "Batch year must be a 4-digit year, e.g. 2023.";
  }
  if (!data.roll_number || data.roll_number.trim().length < 2) {
    return "Roll number is required.";
  }
  return null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Initiates Google OAuth sign-in via Supabase.
 * Redirects the browser to the Google consent screen.
 * On success, Supabase redirects to /auth/callback, which then
 * forwards to /onboarding (first-time) or /dashboard (returning).
 */
export async function signInWithGoogle(): Promise<never> {
  const supabase = await createSupabaseServerClient();

  // The callback URL must be listed in:
  //   Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
  // For local dev: http://localhost:3000/auth/callback
  // For production: https://your-domain.com/auth/callback
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const redirectUrl = `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      // skipBrowserRedirect: false lets Supabase return the OAuth URL
      // which we then redirect to via next/navigation's redirect()
      skipBrowserRedirect: false,
      queryParams: {
        // Request offline access so Supabase stores a refresh token
        access_type: "offline",
        // Always show the Google account chooser — prevents silent sign-in
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    redirect(`/?auth_error=${encodeURIComponent(error?.message ?? "Unknown error")}`);
  }

  redirect(data.url);
}


/**
 * Signs the current user out and redirects to the landing page.
 */
export async function signOut(): Promise<never> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Completes the first-time onboarding questionnaire.
 * Validates the form data, writes to `profiles`, and marks
 * `onboarding_complete = true`.
 *
 * Must be called from the /onboarding page only (middleware enforces this).
 */
export async function completeOnboarding(
  formData: OnboardingFormData
): Promise<ActionResult> {
  // 1. Validate inputs
  const validationError = validateOnboardingData(formData);
  if (validationError) {
    return { success: false, error: validationError };
  }

  // 2. Get authenticated user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to complete onboarding." };
  }

  // 3. Build the profile update payload
  const updatePayload: ProfileUpdate = {
    full_name:          formData.full_name.trim(),
    phone_number:       formData.phone_number.trim(),
    department:         formData.department.trim(),
    course:             formData.course.trim(),
    batch_year:         formData.batch_year.trim(),
    roll_number:        formData.roll_number.trim(),
    onboarding_complete: true,
  };

  // 4. Persist to Supabase
  const { error: updateError } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", user.id);

  if (updateError) {
    console.error("[auth/completeOnboarding] Supabase update error:", updateError);
    return {
      success: false,
      error: "Failed to save your profile. Please try again.",
    };
  }

  // 5. Revalidate to flush cached profile data
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true };
}

/**
 * Returns the currently authenticated user and their profile row.
 * Returns null for both if the user is not signed in.
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("[auth/getAuthenticatedUser] Profile fetch error:", error);
    return { user, profile: null };
  }

  return { user, profile };
}
