"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/app/actions/auth";
import { getActiveInstitutions } from "@/app/actions/admin/institutions";
import { uploadIdCardImage } from "@/app/actions/uploads";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  User,
  Phone,
  Building2,
  Landmark,
  CalendarDays,
  IdCard,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";

const DEPARTMENTS = [
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

const COURSES = [
  "B.Sc. (Hons.) Allied Health Sciences",
  "B.Sc. Medical Laboratory Technology",
  "B.Sc. Radiography & Imaging Technology",
  "B.Sc. Physiotherapy",
  "B.Sc. Optometry",
  "B.Sc. Nutrition & Dietetics",
  "B.Sc. Operation Theatre Technology",
  "B.Sc. Respiratory Therapy",
  "B.Sc. Anaesthesia Technology",
  "B.Sc. Dialysis Technology",
  "B.Sc. Perfusion Technology",
  "M.Sc. (various specialisations)",
  "Ph.D.",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [institutions, setInstitutions] = useState<string[]>(["PGIMER"]);
  const [idCardUrl, setIdCardUrl] = useState("");
  const [idCardUploading, setIdCardUploading] = useState(false);
  const [idCardFileName, setIdCardFileName] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    department: "",
    course: "",
    batch_year: new Date().getFullYear().toString(),
    institution: "PGIMER",
  });

  useEffect(() => {
    getActiveInstitutions().then((result) => {
      if (result.success && result.data && result.data.length > 0) {
        setInstitutions(result.data.map((i) => i.name));
      }
    });
  }, []);

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
        throw new Error(result.error ?? "Failed to upload ID card.");
      }
      setIdCardUrl(result.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload ID card.");
      setIdCardFileName("");
    } finally {
      setIdCardUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!idCardUrl) {
      setError("Please upload a photo of your ID card.");
      return;
    }

    startTransition(async () => {
      const result = await completeOnboarding({ ...formData, id_card_url: idCardUrl });
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
      } else {
        setStep("success");
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    });
  };

  if (step === "success") {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="size-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Profile Complete!</h2>
          <p className="text-muted-foreground">
            Redirecting you to your dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
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
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="size-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label
                htmlFor="full_name"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
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
              <label
                htmlFor="phone_number"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
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

            {/* Department */}
            <div>
              <label
                htmlFor="department"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <Building2 className="size-3.5" /> Department
              </label>
              <select
                id="department"
                name="department"
                required
                value={formData.department}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Course */}
            <div>
              <label
                htmlFor="course"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <GraduationCap className="size-3.5" /> Programme / Course
              </label>
              <select
                id="course"
                name="course"
                required
                value={formData.course}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select programme…</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Institution */}
            <div>
              <label
                htmlFor="institution"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <Landmark className="size-3.5" /> Institution
              </label>
              <select
                id="institution"
                name="institution"
                required
                value={formData.institution}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {institutions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* ID Card */}
            <div>
              <label
                htmlFor="id_card"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
                <IdCard className="size-3.5" /> ID Card Photo
              </label>
              <input
                id="id_card"
                name="id_card"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required={!idCardUrl}
                onChange={handleIdCardChange}
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                {idCardUploading && (
                  <>
                    <Loader2 className="size-3 animate-spin" /> Uploading…
                  </>
                )}
                {!idCardUploading && idCardUrl && (
                  <>
                    <CheckCircle2 className="size-3 text-green-500" /> Uploaded {idCardFileName}
                  </>
                )}
                {!idCardUploading && !idCardUrl && "JPEG, PNG or WebP — used to verify your enrolment."}
              </p>
            </div>

            {/* Batch Year */}
            <div>
              <label
                htmlFor="batch_year"
                className="flex items-center gap-1.5 text-sm font-medium text-foreground"
              >
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

            <Button
              type="submit"
              disabled={isPending || idCardUploading}
              className="w-full gap-2"
            >
              {isPending ? (
                "Saving…"
              ) : (
                <>
                  Save & Continue
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
