/**
 * app/actions/auth.ts
 *
 * Server Actions — Authentication & Onboarding
 * "use server" — runs exclusively on the server, never in the browser.
 *
 * Authentication is our own Google OAuth + signed session cookie (see
 * lib/auth/google.ts and lib/auth/session.ts) — no Supabase Auth.
 */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import {
  clearSessionCookie,
  getSession,
  OAUTH_STATE_COOKIE_NAME,
} from "@/lib/auth/session";
import { buildGoogleAuthUrl } from "@/lib/auth/google";
import { resolveSiteUrl } from "@/lib/site-url";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingFormData {
  full_name: string;
  phone_number: string;
  department: string;
  course: string;
  batch_year: string;
  institution: string;
  id_card_url: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const PHONE_REGEX = /^\+?[0-9\s\-]{7,15}$/;
const BATCH_YEAR_REGEX = /^\d{4}$/;

function validateOnboarding(data: OnboardingFormData): string | null {
  if (!data.full_name?.trim() || data.full_name.trim().length < 2)
    return "Full name must be at least 2 characters.";
  if (!PHONE_REGEX.test(data.phone_number))
    return "Please enter a valid phone number (7–15 digits).";
  if (!data.department?.trim() || data.department.trim().length < 2)
    return "Department is required.";
  if (!data.course?.trim() || data.course.trim().length < 2)
    return "Course / programme is required.";
  if (!BATCH_YEAR_REGEX.test(data.batch_year))
    return "Batch year must be a 4-digit year, e.g. 2023.";
  if (!data.institution?.trim())
    return "Institution is required.";
  if (!data.id_card_url?.trim())
    return "Please upload a photo of your ID card.";
  return null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Initiates our own Google OAuth flow: sets a CSRF `state` cookie and
 * redirects the browser to Google's consent screen.
 */
export async function signInWithGoogle(): Promise<never> {
  const siteUrl = await resolveSiteUrl();
  const redirectUri = `${siteUrl}/auth/callback`;

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes — only needs to survive the round trip to Google
  });

  redirect(buildGoogleAuthUrl(state, redirectUri));
}

/**
 * Signs the current user out and redirects to the home page.
 */
export async function signOut(): Promise<never> {
  await clearSessionCookie();
  redirect("/");
}

/**
 * Completes the first-time onboarding questionnaire.
 * Validates form data, saves to profiles, sets onboarding_complete = true.
 */
export async function completeOnboarding(
  formData: OnboardingFormData
): Promise<ActionResult> {
  const validationError = validateOnboarding(formData);
  if (validationError) return { success: false, error: validationError };

  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be signed in to complete onboarding." };
  }

  const supabase = createSupabaseAdminClient();
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name:           formData.full_name.trim(),
      phone_number:        formData.phone_number.trim(),
      department:          formData.department.trim(),
      course:              formData.course.trim(),
      batch_year:          formData.batch_year.trim(),
      institution:         formData.institution.trim(),
      id_card_url:         formData.id_card_url.trim(),
      onboarding_complete: true,
    })
    .eq("id", session.userId);

  if (updateError) {
    console.error("[auth/completeOnboarding]", updateError);
    return { success: false, error: "Failed to save your profile. Please try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Returns the current authenticated user + their profile row.
 */
export async function getAuthenticatedUser() {
  const session = await getSession();
  if (!session) return { user: null, profile: null };

  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.userId)
    .single();

  if (!profile) return { user: null, profile: null };

  return { user: { id: profile.id, email: profile.email }, profile };
}
