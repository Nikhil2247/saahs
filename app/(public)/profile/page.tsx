"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { signOut } from "@/app/actions/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}

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
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone_number, department, course, batch_year, role, membership_status, avatar_url, onboarding_complete")
        .eq("id", user.id)
        .single();

      setProfile(data as Profile);
      setLoading(false);
    }

    load();
  }, [router]);

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

  const fields = [
    { label: "Email", value: profile.email, icon: Mail },
    { label: "Phone", value: profile.phone_number, icon: Phone },
    { label: "Department", value: profile.department, icon: Building2 },
    { label: "Programme", value: profile.course, icon: GraduationCap },
    { label: "Batch Year", value: profile.batch_year, icon: CalendarDays },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">My Profile</h1>

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
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
                <User className="size-9 text-primary" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-foreground">
              {profile.full_name ?? "—"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
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
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-border" />

        {/* Info grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5" />
                {label}
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {value ?? <span className="text-muted-foreground italic">Not set</span>}
              </p>
            </div>
          ))}
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
              Complete Profile
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
