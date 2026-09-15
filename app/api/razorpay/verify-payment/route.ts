/**
 * app/api/razorpay/verify-payment/route.ts
 *
 * Verifies a Razorpay payment signature and marks the profile as a paid
 * "Outside Member" in the database.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      institution_name,
      // Basic profile fields saved here to avoid calling a Server Action
      // inside the Razorpay handler callback (causes "unexpected response" error)
      full_name,
      phone_number,
      course,
      batch_year,
    } = await req.json();

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Update the profile — auto-approve on successful payment
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        // Payment & membership fields
        is_pgimer_student: false,
        institution_name: institution_name ?? null,
        membership_payment_status: "paid",
        razorpay_payment_id,
        // Auto-verify: assign SAAHS Member role & approve membership immediately
        role: "SAAHS Member",
        membership_status: "Approved",
        onboarding_complete: true,
        // Basic profile fields (avoids needing a Server Action call in the handler)
        ...(full_name    && { full_name: String(full_name).trim() }),
        ...(phone_number && { phone_number: String(phone_number).trim() }),
        ...(course       && { course: String(course).trim() }),
        ...(batch_year   && { batch_year: String(batch_year).trim() }),
      } as any)
      .eq("id", session.userId);

    if (error) {
      console.error("[razorpay/verify-payment] DB update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[razorpay/verify-payment]", err);
    return NextResponse.json({ error: err.message ?? "Verification failed" }, { status: 500 });
  }
}
