"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions/auth";
import { uploadIdCardImage } from "@/app/actions/uploads";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  User,
  Phone,
  CalendarDays,
  IdCard,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Building2,
  CreditCard,
  X,
  BadgeCheck,
} from "lucide-react";
import Script from "next/script";
import { toast } from "sonner";

const COURSES = [
  "Medical Laboratory Science (BMLS)",
  "Medical Radiology & Imaging Technology",
  "Radiotherapy Technology",
  "Operation Theatre Technology",
  "Medical Technology – Perfusionist",
  "Embalming & Mortuary Science",
  "Audiology & Speech-Language Pathology (BASLP)",
  "Medical Technology – Dialysis Therapy",
  "Optometry",
  "Physiotherapy",
  "Health Information Management",
  "Public Health",
  "Medical Animation & Audio-Visual Creation",
];

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "membership" | "success">("form");
  const [idCardUrl, setIdCardUrl] = useState("");
  const [idCardUploading, setIdCardUploading] = useState(false);
  const [idCardFileName, setIdCardFileName] = useState("");
  const [isPgimer, setIsPgimer] = useState<boolean | null>(null);
  const [membershipPaying, setMembershipPaying] = useState(false);
  const [membershipPaid, setMembershipPaid] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    course: "",
    batch_year: new Date().getFullYear().toString(),
    institution_name: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleIdCardChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setIdCardFileName(file.name);
    setIdCardUploading(true);
    try {
      const result = await uploadIdCardImage(file);
      if (!result.success || !result.data) {
        // Show a prominent toast error AND reset the file name
        const msg = result.error ?? "Failed to upload ID card.";
        toast.error(msg, { duration: 6000 });
        setIdCardFileName("");
        // Reset the file input so the user can re-select
        e.target.value = "";
        return;
      }
      setIdCardUrl(result.data.url);
      toast.success("ID card uploaded successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload ID card.";
      toast.error(msg, { duration: 6000 });
      setIdCardFileName("");
      e.target.value = "";
    } finally {
      setIdCardUploading(false);
    }
  };

  // ── PGIMER student submission ────────────────────────────────────────────────

  const handlePgimerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.full_name.trim()) return setError("Full name is required.");
    if (!formData.phone_number.trim()) return setError("Phone number is required.");
    if (!formData.course) return setError("Course is required.");
    if (!formData.batch_year.match(/^\d{4}$/)) return setError("Batch year must be 4 digits.");
    if (!idCardUrl) return setError("Please upload your PGIMER ID card.");

    startTransition(async () => {
      const result = await completeOnboarding({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        course: formData.course,
        batch_year: formData.batch_year,
        is_pgimer_student: true,
        id_card_url: idCardUrl,
      });
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
      } else {
        setStep("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    });
  };

  // ── Razorpay membership payment ──────────────────────────────────────────────

  const handleRazorpayPayment = useCallback(async () => {
    if (!formData.full_name.trim()) return setError("Please fill in your name first.");
    if (!formData.phone_number.trim()) return setError("Please fill in your phone number first.");
    if (!formData.course) return setError("Please select your course first.");
    if (!formData.institution_name.trim()) return setError("Please enter your institution name.");

    setMembershipPaying(true);
    setError("");

    try {
      // 1. Create order on the server
      const orderRes = await fetch("/api/razorpay/create-order", { method: "POST" });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error ?? "Failed to create payment order.");

      // 2. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SAAHS",
        description: "SAAHS Outside Member Registration Fee",
        order_id: orderData.orderId,
        prefill: {
          name: formData.full_name,
          contact: formData.phone_number,
        },
        theme: { color: "#7c3aed" },
        handler: async (response: any) => {
          // 3. Verify payment + save full profile in one API call.
          // NOTE: We use fetch() here — NOT a Server Action — because Server Actions
          // cannot be called from inside an arbitrary async callback like this handler.
          const verifyRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              institution_name: formData.institution_name,
              // Profile fields — saved here so we don't need a Server Action call
              full_name: formData.full_name,
              phone_number: formData.phone_number,
              course: formData.course,
              batch_year: formData.batch_year,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(verifyData.error ?? "Payment verification failed.");

          setMembershipPaid(true);
          setStep("success");
          setTimeout(() => router.push("/dashboard"), 2000);
        },
      };

      if (!window.Razorpay) throw new Error("Razorpay SDK not loaded. Please refresh and try again.");
      const rz = new window.Razorpay(options);
      rz.on("payment.failed", (resp: any) => {
        setError(`Payment failed: ${resp.error?.description ?? "Unknown error"}`);
      });
      rz.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setMembershipPaying(false);
    }
  }, [formData, router]);

  // ── Success screen ────────────────────────────────────────────────────────────

  if (step === "success") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="size-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {membershipPaid ? "Membership Activated!" : "Profile Complete!"}
          </h2>
          <p className="text-muted-foreground">Redirecting you to your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Load Razorpay SDK */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary">
              <GraduationCap className="size-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This information helps us personalise your SAAHS portal experience.
              You only need to do this once.
            </p>
          </div>

          <Card className="border-border p-8">
            <div className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                  <AlertCircle className="size-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <User className="size-3.5" /> Full Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Ananya Bose"
                  className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone_number" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Phone className="size-3.5" /> Phone Number
                </label>
                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Course */}
              <div>
                <label htmlFor="course" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <GraduationCap className="size-3.5" /> Course / Discipline
                </label>
                <select
                  id="course"
                  name="course"
                  required
                  value={formData.course}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select course…</option>
                  {COURSES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Batch Year */}
              <div>
                <label htmlFor="batch_year" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <CalendarDays className="size-3.5" /> Batch Year
                </label>
                <input
                  id="batch_year"
                  name="batch_year"
                  type="text"
                  required
                  maxLength={4}
                  value={formData.batch_year}
                  onChange={handleChange}
                  placeholder="2023"
                  className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* PGIMER Yes/No */}
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-3">
                  <Building2 className="size-3.5" /> Are you a student of PGIMER?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setIsPgimer(true); setError(""); }}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                      isPgimer === true
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    ✓ Yes, I am a PGIMER Student
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsPgimer(false); setError(""); }}
                    className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                      isPgimer === false
                        ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border-border text-muted-foreground hover:border-amber-500/50"
                    }`}
                  >
                    ✗ No, I'm from another institution
                  </button>
                </div>
              </div>

              {/* ── PGIMER path: ID card upload ────────────────────────────── */}
              {isPgimer === true && (
                <form onSubmit={handlePgimerSubmit} className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    PGIMER Student Verification
                  </p>
                  <div>
                    <label htmlFor="id_card" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <IdCard className="size-3.5" /> Upload PGIMER ID Card
                    </label>
                    <input
                      id="id_card"
                      name="id_card"
                      type="file"
                      accept="image/*"
                      required={!idCardUrl}
                      onChange={handleIdCardChange}
                      className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {idCardUploading && <><Loader2 className="size-3 animate-spin" /> Uploading…</>}
                      {!idCardUploading && idCardUrl && <><CheckCircle2 className="size-3 text-green-500" /> Uploaded: {idCardFileName}</>}
                      {!idCardUploading && !idCardUrl && (
                        <>
                          <AlertCircle className="size-3 shrink-0" />
                          Any image format (JPG, PNG, HEIC, AVIF…) · Max size: <strong className="text-foreground">1 MB</strong>
                        </>
                      )}
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={isPending || idCardUploading}
                    className="w-full gap-2"
                  >
                    {isPending ? "Saving…" : <><BadgeCheck className="size-4" /> Complete PGIMER Registration<ArrowRight className="size-4" /></>}
                  </Button>
                </form>
              )}

              {/* ── Non-PGIMER path: Membership card ──────────────────────── */}
              {isPgimer === false && (
                <div className="rounded-xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
                      <CreditCard className="size-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Become a SAAHS Member</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Join SAAHS as an outside registered member with full access to all resources.
                      </p>
                    </div>
                  </div>

                  {/* Membership fee highlight */}
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">One-time Membership Fee</span>
                    <span className="text-2xl font-extrabold text-amber-600">₹350</span>
                  </div>

                  {/* What you get */}
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {[
                      "📚 e-Library Access",
                      "📖 Exclusive Study Material",
                      "🎓 Discounted Registration",
                      "💻 e-Classes & Online Lectures",
                      "🧑‍⚕️ Academic & Professional Networking",
                      "🏥 Association Activities",
                      "📢 Member Updates & Opportunities",
                      "🤝 Student Community Benefits",
                    ].map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2">
                        <span className="text-sm leading-snug">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Institution name input */}
                  <div>
                    <label htmlFor="institution_name" className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Building2 className="size-3.5" /> Your Institution Name
                    </label>
                    <input
                      id="institution_name"
                      name="institution_name"
                      type="text"
                      required
                      value={formData.institution_name}
                      onChange={handleChange}
                      placeholder="e.g. AIIMS Delhi, Manipal College of Health Professions"
                      className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleRazorpayPayment}
                    disabled={membershipPaying || !razorpayLoaded}
                    className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold"
                  >
                    {membershipPaying ? (
                      <><Loader2 className="size-4 animate-spin" /> Opening Payment…</>
                    ) : (
                      <><CreditCard className="size-4" /> Pay ₹350 & Activate Membership</>
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    Secured by Razorpay · UPI, Cards, Net Banking accepted
                  </p>
                </div>
              )}

              {isPgimer === null && (
                <p className="text-center text-sm text-muted-foreground italic">
                  Please select whether you are a PGIMER student to continue.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
