"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signInWithGoogle } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ShieldCheck } from "lucide-react";

/** Google "G" SVG icon */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Read auth_error from URL (set by callback route on failure)
  if (typeof window !== "undefined") {
    const urlError = new URLSearchParams(window.location.search).get("auth_error");
    if (urlError && !error) setError(decodeURIComponent(urlError));
  }

  const handleGoogleSignIn = () => {
    setError(null);
    startTransition(async () => {
      await signInWithGoogle();
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary">
            <ShieldCheck className="size-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Sign In to SAAHS</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Access the Student Association of Allied Health Sciences portal
          </p>
        </div>

        <Card className="border-border p-8">
          <div className="flex flex-col gap-4">
            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="size-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Google Sign-In button */}
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full gap-3 text-sm font-medium"
              onClick={handleGoogleSignIn}
              disabled={isPending}
            >
              <GoogleIcon />
              {isPending ? "Redirecting to Google…" : "Continue with Google"}
            </Button>

            {/* Policy note */}
            <p className="text-center text-xs text-muted-foreground">
              By signing in you agree to SAAHS&apos;s{" "}
              <Link href="/about" className="underline hover:text-foreground">
                terms of use
              </Link>
              . Only institutional Google accounts are permitted.
            </p>

            {/* Divider + info */}
            <div className="mt-2 rounded-lg border border-border bg-secondary/50 p-4">
              <p className="text-xs font-semibold text-foreground mb-1">
                🔒 Secure Single Sign-On
              </p>
              <p className="text-xs text-muted-foreground">
                SAAHS uses Google OAuth exclusively — no passwords are stored.
                Sign in with your institutional Google account (e.g.{" "}
                <span className="font-mono">@pgimer.edu.in</span>).
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
