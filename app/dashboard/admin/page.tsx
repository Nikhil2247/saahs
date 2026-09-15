/**
 * app/dashboard/admin/page.tsx
 *
 * Admin / Executive Dashboard — accessible to Executive Body Members and above.
 * Compact, modern UI with minimal scroll, sleek KPI cards, and quick actions.
 */

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
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
  Building2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", session.userId)
    .single();

  // Aggregate stats in parallel
  const [
    { count: totalMembers },
    { count: pendingMemberships },
    { count: openGrievances },
    { count: totalNotices },
    { count: totalEvents },
    { data: recentGrievances },
    { data: pendingProfiles },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("role", "Public User"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("membership_status", "Pending"),
    supabase
      .from("grievances")
      .select("*", { count: "exact", head: true })
      .in("status", ["Submitted", "Under Review", "In Progress"]),
    supabase.from("notices").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase
      .from("grievances")
      .select("ticket_number, title, status, category, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("profiles")
      .select("id, full_name, email, department, created_at")
      .eq("membership_status", "Pending")
      .order("created_at", { ascending: true })
      .limit(4),
  ]);

  const adminModules = [
    {
      label: "Memberships",
      href: "/dashboard/admin/memberships",
      icon: Users,
      badge: pendingMemberships && pendingMemberships > 0 ? `${pendingMemberships} pending` : null,
      badgeVariant: "destructive" as const,
      description: "Approve or review member applications",
    },
    {
      label: "Notices & Minutes",
      href: "/dashboard/admin/notices",
      icon: Bell,
      badge: `${totalNotices ?? 0} total`,
      badgeVariant: "secondary" as const,
      description: "Circulars, meeting minutes & official docs",
    },
    {
      label: "Events",
      href: "/dashboard/admin/events",
      icon: Calendar,
      badge: `${totalEvents ?? 0} listed`,
      badgeVariant: "secondary" as const,
      description: "Workshops, conferences, sports & cultural",
    },
    {
      label: "Grievances",
      href: "/dashboard/admin/grievances",
      icon: ClipboardList,
      badge: openGrievances && openGrievances > 0 ? `${openGrievances} open` : null,
      badgeVariant: "destructive" as const,
      description: "Manage and resolve submitted tickets",
    },
    {
      label: "E-Library",
      href: "/dashboard/admin/library",
      icon: BookOpen,
      badge: null,
      badgeVariant: "secondary" as const,
      description: "Course materials, notes, folders & PYQs",
    },
    {
      label: "Meetings",
      href: "/dashboard/admin/meetings",
      icon: FileText,
      badge: null,
      badgeVariant: "secondary" as const,
      description: "Official meetings, agendas, attendees & records",
    },
    {
      label: "Institutions",
      href: "/dashboard/admin/institutions",
      icon: Building2,
      badge: null,
      badgeVariant: "secondary" as const,
      description: "Recognized colleges & institutions directory",
    },
  ];

  return (
    <div className="dashboard-container space-y-5">
      {/* Executive Welcome Bar */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Executive Console</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              {profile?.role ?? "Admin"}
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Welcome, {profile?.full_name ?? "Administrator"}
          </h1>
        </div>
        <div className="flex items-center gap-2 pt-1 sm:pt-0">
          <Button variant="default" size="sm" render={<Link href="/dashboard/admin/notices" className="text-xs font-medium" />}>
            <Bell className="mr-1.5 size-3.5" /> Post Notice
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/dashboard/admin/memberships" className="text-xs font-medium" />}>
            <Users className="mr-1.5 size-3.5" /> Review Members
          </Button>
        </div>
      </div>

      {/* High-density KPI stat grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="p-3.5 border-border shadow-2xs hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Total Members</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{totalMembers ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active registered base</p>
        </Card>

        <Card className="p-3.5 border-border shadow-2xs hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Pending Approvals</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
              <TrendingUp className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-600">{pendingMemberships ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting verification</p>
        </Card>

        <Card className="p-3.5 border-border shadow-2xs hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Open Grievances</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-rose-500/10 text-rose-600">
              <ClipboardList className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-rose-600">{openGrievances ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Needs redressal</p>
        </Card>

        <Card className="p-3.5 border-border shadow-2xs hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Notices & Circulars</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
              <Bell className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{totalNotices ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Published documents</p>
        </Card>

        <Card className="p-3.5 border-border shadow-2xs hover:border-emerald-500/30 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Scheduled Events</span>
            <div className="flex size-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{totalEvents ?? 0}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Active activities</p>
        </Card>
      </div>

      {/* Module quick-links strip */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Administrative Modules
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {adminModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.href} href={mod.href} className="group">
                <Card className="h-full p-3.5 border-border shadow-2xs hover:border-primary/40 hover:bg-secondary/25 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="size-4" />
                      </div>
                      {mod.badge && (
                        <Badge variant={mod.badgeVariant} className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                          {mod.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {mod.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                      {mod.description}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Manage</span>
                    <ArrowRight className="ml-1 size-3" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 2-Column Action Feeds: Recent Grievances & Pending Applications */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Grievances Card */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              <span>Recent Grievance Submissions</span>
            </CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/dashboard/admin/grievances" className="text-xs text-primary font-medium" />}>
              View all <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {recentGrievances && recentGrievances.length > 0 ? (
              recentGrievances.map((g) => (
                <div key={g.ticket_number} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{g.title}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {g.ticket_number} · {g.category}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] font-medium px-2 py-0.5"
                  >
                    {g.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="size-6 text-emerald-500/60 mx-auto mb-1.5" />
                No pending grievance tickets.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Memberships Card */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span>Pending Member Applications</span>
            </CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/dashboard/admin/memberships" className="text-xs text-primary font-medium" />}>
              Review <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {pendingProfiles && pendingProfiles.length > 0 ? (
              pendingProfiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{p.full_name ?? "New Applicant"}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {p.email} · {p.department ?? "General"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px] font-medium bg-amber-500/10 text-amber-700">
                    Awaiting Review
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="size-6 text-emerald-500/60 mx-auto mb-1.5" />
                All membership applications have been reviewed.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
