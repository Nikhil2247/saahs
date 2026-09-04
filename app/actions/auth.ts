/**
 * app/actions/auth.ts
 *
 * Server Actions — Authentication & Onboarding
 * "use server" — runs exclusively on the server, never in the browser.
 */

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

// ─── Shared Supabase factory (inline to avoid cross-directory imports) ─────────

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: SESSION_MAX_AGE,
                ...options,
              })
            );
          } catch { /* Read-only context — middleware handles refresh */ }
        },
      },
    }
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingFormData {
  full_name: string;
  phone_number: string;
  department: string;
  course: string;
  batch_year: string;
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
  return null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Initiates Google OAuth via Supabase.
 * Redirects the browser to Google's consent screen.
 * After consent, Google → Supabase → /auth/callback → /onboarding | /dashboard.
 */
export async function signInWithGoogle(): Promise<never> {
  const supabase = await getSupabase();

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!siteUrl) {
    const headersList = await headers();
    let host = headersList.get("x-forwarded-host") || headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
    siteUrl = `${proto}://${host}`;
  }

  if (siteUrl.includes("0.0.0.0")) {
    siteUrl = siteUrl.replace(/0\.0\.0\.0/g, "localhost");
  }

  const redirectUrl = `${siteUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: false,
      queryParams: {
        access_type: "offline",   // ensures refresh token is stored
        prompt: "select_account", // always show account picker
      },
    },
  });

  if (error || !data.url) {
    redirect(`/?auth_error=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }

  redirect(data.url);
}

/**
 * Signs the current user out and redirects to the home page.
 */
export async function signOut(): Promise<never> {
  const supabase = await getSupabase();
  await supabase.auth.signOut();
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

  const supabase = await getSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "You must be signed in to complete onboarding." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      full_name:           formData.full_name.trim(),
      phone_number:        formData.phone_number.trim(),
      department:          formData.department.trim(),
      course:              formData.course.trim(),
      batch_year:          formData.batch_year.trim(),
      onboarding_complete: true,
    })
    .eq("id", user.id);

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
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}
