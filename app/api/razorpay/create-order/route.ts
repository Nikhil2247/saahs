/**
 * app/api/razorpay/create-order/route.ts
 *
 * Creates a Razorpay order for the ₹350 SAAHS membership fee.
 * Called client-side before opening the Razorpay checkout dialog.
 */

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSession } from "@/lib/auth/session";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await razorpay.orders.create({
      amount: 35000, // ₹350 in paise (1 rupee = 100 paise)
      currency: "INR",
      receipt: `saahs_membership_${session.userId.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: session.userId,
        purpose: "SAAHS Outside Member Registration",
      },
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err: any) {
    console.error("[razorpay/create-order]", err);
    return NextResponse.json({ error: err.message ?? "Failed to create order" }, { status: 500 });
  }
}
