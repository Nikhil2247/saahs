"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut, getAuthenticatedUser } from "@/app/actions/auth";
import { updateProfile } from "@/app/actions/profile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Building2,
  GraduationCap,
  CalendarDays,
  LogOut,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  X,
  Save,
  Loader2,
  IdCard,
} from "lucide-react";

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

interface Profile {
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  department: string | null;
  course: string | null;
  batch_year: string | null;
  role: string | null;
  membership_status: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean | null;
  institution: string | null;
  is_pgimer_student: boolean | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    course: "",
    batch_year: "",
    institution_name: "",
  });

  useEffect(() => {
    async function load() {
      const { user, profile: profileData } = await getAuthenticatedUser();
      if (!user) { router.push("/login"); return; }
      const p = profileData as Profile | null;
      setProfile(p);
      if (p) {
        setForm({
          full_name: p.full_name ?? "",
          phone_number: p.phone_number ?? "",
          course: p.course ?? "",
          batch_year: p.batch_year ?? "",
          institution_name: p.institution ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const result = await updateProfile(form);
      if (!result.success) {
        setError(result.error ?? "Failed to update profile.");
        toast.error(result.error ?? "Failed to update profile.");
      } else {
        toast.success("Profile updated successfully!");
        // refresh local state
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                full_name: form.full_name,
                phone_number: form.phone_number,
                course: form.course,
                batch_year: form.batch_year,
                institution: form.institution_name,
              }
            : prev
        );
        setEditing(false);
      }
    });
  };

  const handleCancelEdit = () => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone_number: profile.phone_number ?? "",
        course: profile.course ?? "",
        batch_year: profile.batch_year ?? "",
        institution_name: profile.institution ?? "",
      });
    }
    setError("");
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <p className="text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const membershipBadge: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    Approved: {
      label: "SAAHS Member",
      icon: <CheckCircle2 className="size-3.5" />,
      className: "bg-green-500/10 text-green-600 border-green-200",
    },
    Pending: {
      label: "Membership Pending",
      icon: <Clock className="size-3.5" />,
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    },
    Rejected: {
      label: "Membership Rejected",
      icon: <XCircle className="size-3.5" />,
      className: "bg-red-500/10 text-red-600 border-red-200",
    },
  };

  const badge = membershipBadge[profile.membership_status ?? "Pending"];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        {!editing ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleCancelEdit}
              disabled={isPending}
            >
              <X className="size-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? (
                <><Loader2 className="size-4 animate-spin" /> Saving…</>
              ) : (
                <><Save className="size-4" /> Save Changes</>
              )}
            </Button>
          </div>
        )}
      </div>

      <Card className="border-border p-6">
        {/* Avatar + name + role */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name ?? "Avatar"}
                width={80}
                height={80}
                className="rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 ring-2 ring-border">
                <User className="size-9 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            {editing ? (
              <input
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xl font-bold text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <h2 className="text-xl font-bold text-foreground">
                {profile.full_name ?? "—"}
              </h2>
            )}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {profile.role && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Shield className="size-3" />
                  {profile.role}
                </Badge>
              )}
              {badge && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                >
                  {badge.icon}
                  {badge.label}
                </span>
              )}
              {profile.is_pgimer_student && (
                <Badge variant="outline" className="gap-1 text-xs border-primary/40 text-primary">
                  <IdCard className="size-3" />
                  PGIMER Student
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Info grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Email — always read-only (comes from Google) */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
              <Mail className="size-3.5" />
              Email
            </p>
            <p className="text-sm font-medium text-foreground">
              {profile.email ?? <span className="italic text-muted-foreground">Not set</span>}
            </p>
            {editing && (
              <p className="mt-1 text-xs text-muted-foreground italic">Email is managed by Google and cannot be changed.</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1" htmlFor="phone_number">
              <Phone className="size-3.5" />
              Phone
            </label>
            {editing ? (
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">
                {profile.phone_number ?? <span className="italic text-muted-foreground">Not set</span>}
              </p>
            )}
          </div>

          {/* Course */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1" htmlFor="course">
              <GraduationCap className="size-3.5" />
              Programme / Course
            </label>
            {editing ? (
              <select
                id="course"
                name="course"
                value={form.course}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select course…</option>
                {COURSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {profile.course ?? <span className="italic text-muted-foreground">Not set</span>}
              </p>
            )}
          </div>

          {/* Batch Year */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1" htmlFor="batch_year">
              <CalendarDays className="size-3.5" />
              Batch Year
            </label>
            {editing ? (
              <input
                id="batch_year"
                name="batch_year"
                type="text"
                maxLength={4}
                value={form.batch_year}
                onChange={handleChange}
                placeholder="2023"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">
                {profile.batch_year ?? <span className="italic text-muted-foreground">Not set</span>}
              </p>
            )}
          </div>

          {/* Institution */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1" htmlFor="institution_name">
              <Building2 className="size-3.5" />
              Institution
            </label>
            {editing && !profile.is_pgimer_student ? (
              <input
                id="institution_name"
                name="institution_name"
                type="text"
                value={form.institution_name}
                onChange={handleChange}
                placeholder="e.g. AIIMS Delhi, Manipal College of Health Professions"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">
                {profile.is_pgimer_student
                  ? "PGIMER Chandigarh"
                  : (profile.institution ?? <span className="italic text-muted-foreground">Not set</span>)}
              </p>
            )}
            {editing && profile.is_pgimer_student && (
              <p className="mt-1 text-xs text-muted-foreground italic">Institution is fixed for PGIMER students.</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {!profile.onboarding_complete && (
            <Button
              variant="outline"
              onClick={() => router.push("/onboarding")}
              className="flex-1"
            >
              Complete Profile Setup
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={async () => { await signOut(); }}
            className="flex-1 gap-2"
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
