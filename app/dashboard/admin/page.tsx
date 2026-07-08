/**
 * app/dashboard/admin/page.tsx
 *
 * Admin / Executive Dashboard — accessible to Executive Body Members and above.
 * Middleware enforces role guard; this page just renders the management UI.
 */

import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  Users,
  FileText,
  Bell,
  Calendar,
  Shield,
  BookOpen,
  ArrowRight,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ─── Supabase factory ──────────────────────────────────────────────────────────

async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs: Array<{ name: string; value: string; options?: CookieOptions }>) => {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* ignored */ }
        },
      },
    }
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await getServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  // ── Aggregate stats ────────────────────────────────────────────────────────

  const [
    { count: totalMembers },
    { count: pendingMemberships },
    { count: openGrievances },
    { count: totalNotices },
    { count: totalEvents },
    { data: recentGrievances },
    { data: pendingProfiles },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .neq("role", "Public User"),
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .eq("membership_status", "Pending"),
    supabase.from("grievances").select("*", { count: "exact", head: true })
      .in("status", ["Submitted", "Under Review", "In Progress"]),
    supabase.from("notices").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("grievances").select("ticket_number, title, status, category, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("profiles")
      .select("id, full_name, email, department, created_at")
      .eq("membership_status", "Pending")
      .order("created_at", { ascending: true })
      .limit(5),
  ]);

  const statusColor: Record<string, string> = {
    Submitted: "bg-blue-500/10 text-blue-600",
    "Under Review": "bg-yellow-500/10 text-yellow-600",
    "In Progress": "bg-purple-500/10 text-purple-600",
    Resolved: "bg-green-500/10 text-green-600",
    Closed: "bg-gray-500/10 text-gray-600",
  };

  const adminModules = [
    { label: "Membership Requests", href: "/dashboard/admin/memberships", icon: Users, badge: pendingMemberships ?? 0, description: "Review pending applications" },
    { label: "Grievances", href: "/dashboard/admin/grievances", icon: ClipboardList, badge: openGrievances ?? 0, description: "Manage open tickets" },
    { label: "Notices", href: "/dashboard/admin/notices", icon: Bell, badge: null, description: "Publish & manage notices" },
    { label: "Events", href: "/dashboard/admin/events", icon: Calendar, badge: null, description: "Create & manage events" },
    { label: "E-Library", href: "/dashboard/admin/library", icon: BookOpen, badge: null, description: "Upload resources" },
    { label: "Meetings", href: "/dashboard/admin/meetings", icon: FileText, badge: null, description: "Meeting minutes & records" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="size-5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {profile?.role ?? "Admin"}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{profile?.full_name}</span>
        </p>
      </div>

      {/* Stat strip */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Members", value: totalMembers ?? 0, icon: Users },
          { label: "Pending Memberships", value: pendingMemberships ?? 0, icon: TrendingUp },
          { label: "Open Grievances", value: openGrievances ?? 0, icon: ClipboardList },
          { label: "Notices Published", value: totalNotices ?? 0, icon: Bell },
          { label: "Events Listed", value: totalEvents ?? 0, icon: Calendar },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-4 border-border p-5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Module quick-links */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Management Modules
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {adminModules.map(({ label, href, icon: Icon, badge, description }) => (
            <Link key={href} href={href}>
              <Card className="group flex items-center gap-4 border-border p-5 transition-colors hover:border-primary/40 hover:bg-secondary/30">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    {badge !== null && badge > 0 && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{description}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Grievances */}
        <Card className="border-border">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="size-4" /> Recent Grievances
            </h2>
            <Link href="/dashboard/admin/grievances" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentGrievances && recentGrievances.length > 0 ? (
              recentGrievances.map((g) => (
                <div key={g.ticket_number} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{g.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{g.ticket_number} · {g.category}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[g.status] ?? "bg-secondary"}`}>
                    {g.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No grievances yet.</p>
            )}
          </div>
        </Card>

        {/* Pending Memberships */}
        <Card className="border-border">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Users className="size-4" /> Pending Memberships
            </h2>
            <Link href="/dashboard/admin/memberships" className="text-xs text-primary hover:underline flex items-center gap-1">
              Review all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {pendingProfiles && pendingProfiles.length > 0 ? (
              pendingProfiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{p.full_name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email} · {p.department}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">Pending</Badge>
                </div>
              ))
            ) : (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No pending applications.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
