/**
 * app/signup/page.tsx
 *
 * Signup is handled via Google OAuth — redirect to the login page.
 * No email/password registration is supported in SAAHS.
 */

import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/login");
}
