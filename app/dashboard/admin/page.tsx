/**
 * app/dashboard/admin/page.tsx
 *
 * Role-aware Admin Dashboard — content filtered per role tier.
 * - President / VP        : Full access — all KPIs + all modules
 * - Governing Body        : All modules except Users; full KPIs
 * - Executive Body Member : E-Library access only; limited KPIs
 * - Faculty               : E-Library + dept-student view; limited KPIs
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
  CheckCircle2,
  Crown,
  BookMarked,
  Lock,
  Camera,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  canManageMembers,
  canPostNotices,
  canResolveGrievances,
  isLeadership,
  isGoverningBody,
  isFaculty,
  getRoleTier,
} from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createSupabaseAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, department")
    .eq("id", session.userId)
    .single();

  const userRole = profile?.role ?? "";
  const roleTier = getRoleTier(userRole);
  const isGovBody = isGoverningBody(userRole);
  const isLeader = isLeadership(userRole);
  const isFacultyUser = isFaculty(userRole);

  // ── Fetch stats based on role tier ─────────────────────────────────────────
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
    // Only governing body+ sees recent grievances feed
    isGovBody
      ? supabase
          .from("grievances")
          .select("ticket_number, title, status, category, created_at")
          .order("created_at", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: null }),
    // Only governing body+ sees pending applications feed
    isGovBody
      ? supabase
          .from("profiles")
          .select("id, full_name, email, department, created_at")
          .eq("membership_status", "Pending")
          .order("created_at", { ascending: true })
          .limit(4)
      : Promise.resolve({ data: null }),
  ]);

  // ── Role badge config ───────────────────────────────────────────────────────
  const roleBadgeClass =
    isLeader
      ? "bg-amber-500/10 text-amber-700 border-amber-300"
      : isGovBody
      ? "bg-blue-500/10 text-blue-700 border-blue-300"
      : isFacultyUser
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
      : "bg-purple-500/10 text-purple-700 border-purple-300";

  // ── Module cards per role ───────────────────────────────────────────────────
  type ModuleCard = {
    label: string;
    href: string;
    icon: React.ElementType;
    badge: string | null;
    badgeVariant: "destructive" | "secondary";
    description: string;
    locked?: boolean;
  };

  const allModules: ModuleCard[] = [
    {
      label: "Users",
      href: "/dashboard/admin/users",
      icon: Users,
      badge: null,
      badgeVariant: "secondary",
      description: "All registered portal users",
    },
    {
      label: "Memberships",
      href: "/dashboard/admin/memberships",
      icon: Shield,
      badge: pendingMemberships && pendingMemberships > 0 ? `${pendingMemberships} pending` : null,
      badgeVariant: "destructive",
      description: canManageMembers(userRole)
        ? "Approve or review member applications"
        : "View member directory",
    },
    {
      label: "Notices & Minutes",
      href: "/dashboard/admin/notices",
      icon: Bell,
      badge: `${totalNotices ?? 0} total`,
      badgeVariant: "secondary",
      description: "Circulars, meeting minutes & official docs",
    },
    {
      label: "Events",
      href: "/dashboard/admin/events",
      icon: Calendar,
      badge: `${totalEvents ?? 0} listed`,
      badgeVariant: "secondary",
      description: "Workshops, conferences, sports & cultural",
    },
    {
      label: "Grievances",
      href: "/dashboard/admin/grievances",
      icon: ClipboardList,
      badge: openGrievances && openGrievances > 0 ? `${openGrievances} open` : null,
      badgeVariant: "destructive",
      description: "Manage and resolve submitted tickets",
    },
    {
      label: "E-Library",
      href: "/dashboard/admin/library",
      icon: BookOpen,
      badge: null,
      badgeVariant: "secondary",
      description: "Course materials, notes, folders & PYQs",
    },
    {
      label: "Meetings",
      href: "/dashboard/admin/meetings",
      icon: FileText,
      badge: null,
      badgeVariant: "secondary",
      description: "Official meetings, agendas, attendees & records",
    },
    {
      label: "Institutions",
      href: "/dashboard/admin/institutions",
      icon: Building2,
      badge: null,
      badgeVariant: "secondary",
      description: "Recognized colleges & institutions directory",
    },
    {
      label: "Event Gallery",
      href: "/dashboard/admin/gallery",
      icon: Camera,
      badge: "Media",
      badgeVariant: "secondary",
      description: "Upload & manage executed event photos & albums",
    },
  ];

  // Filter modules per role
  const visibleModules = allModules.filter((m) => {
    if (isLeader) return true; // VP/President: everything
    if (isGovBody) return m.href !== "/dashboard/admin/users";
    if (isFacultyUser) return m.href === "/dashboard/admin/library";
    // Executive Body
    return m.href === "/dashboard/admin/library" || m.href === "/dashboard/admin/gallery";
  });

  // ── Quick action buttons per role ───────────────────────────────────────────
  const quickActions: { label: string; href: string; icon: React.ElementType }[] = [];
  if (canPostNotices(userRole)) {
    quickActions.push({ label: "Post Notice", href: "/dashboard/admin/notices", icon: Bell });
  }
  if (canManageMembers(userRole)) {
    quickActions.push({ label: "Review Members", href: "/dashboard/admin/memberships", icon: Users });
  }
  if (isGovBody || isLeader) {
    quickActions.push({ label: "Manage Gallery", href: "/dashboard/admin/gallery", icon: Camera });
  }
  if (!canPostNotices(userRole)) {
    quickActions.push({ label: "Browse E-Library", href: "/dashboard/admin/library", icon: BookOpen });
  }

  return (
    <div className="dashboard-container space-y-5">
      {/* Welcome Bar */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {roleTier} Console
            </span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${roleBadgeClass}`}>
              {userRole || "Admin"}
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Welcome, {profile?.full_name ?? "Administrator"}
          </h1>
          {isFacultyUser && profile?.department && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Department: <strong>{profile.department}</strong>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1 sm:pt-0 flex-wrap">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.href}
                variant={action === quickActions[0] ? "default" : "outline"}
                size="sm"
                render={<Link href={action.href} className="text-xs font-medium" />}
              >
                <Icon className="mr-1.5 size-3.5" /> {action.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Role-access notice for restricted roles */}
      {!isGovBody && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
          <Lock className="size-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-300">
            <strong>Limited Access:</strong>{" "}
            {isFacultyUser
              ? "As Faculty, you can view students from your department and upload resources to the E-Library."
              : "As an Executive Body Member, you have read-only access to student details and full E-Library access."}
          </div>
        </div>
      )}

      {/* KPI Cards — only for governing body and above */}
      {isGovBody && (
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
      )}

      {/* Module quick-links */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {isFacultyUser || !isGovBody ? "Your Access Modules" : "Administrative Modules"}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {visibleModules.map((mod) => {
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
                    <span>Open</span>
                    <ArrowRight className="ml-1 size-3" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Action Feeds — only for governing body and above */}
      {isGovBody && (
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
                    <Badge variant="outline" className="shrink-0 text-[10px] font-medium px-2 py-0.5">
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

          {/* Pending Memberships Card — only VP/President can act */}
          <Card className="border-border shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 py-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <span>Pending Member Applications</span>
              </CardTitle>
              <Button variant="ghost" size="sm" render={<Link href="/dashboard/admin/memberships" className="text-xs text-primary font-medium" />}>
                {canManageMembers(userRole) ? "Review" : "View"} <ArrowRight className="ml-1 size-3" />
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
                      {canManageMembers(userRole) ? "Awaiting Review" : "Pending"}
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
      )}
    </div>
  );
}
