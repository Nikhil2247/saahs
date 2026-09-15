/**
 * app/dashboard/student/page.tsx
 *
 * Student / Member Dashboard Overview — high density, modern UI.
 */

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import {
  Bell,
  Calendar,
  ClipboardList,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Building,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = createSupabaseAdminClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, department, course, batch_year, role, membership_status, avatar_url, is_pgimer_student, institution_name, membership_payment_status")
    .eq("id", session.userId)
    .single();

  if (!profile?.full_name) redirect("/onboarding");

  // Fetch latest 4 notices
  const { data: notices } = await supabase
    .from("notices")
    .select("id, title, category, section, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  // Fetch upcoming 4 events
  const { data: events } = await supabase
    .from("events")
    .select("id, title, category, schedule, venue")
    .eq("past_archive", false)
    .gte("schedule", new Date().toISOString())
    .order("schedule", { ascending: true })
    .limit(4);

  // Fetch user's own grievances
  const { data: myTickets } = await supabase
    .from("grievances")
    .select("id, ticket_number, title, status, created_at")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(3);

  const statusColor: Record<string, string> = {
    Submitted: "bg-blue-500/10 text-blue-700 border-blue-200",
    "Under Review": "bg-amber-500/10 text-amber-700 border-amber-200",
    "In Progress": "bg-purple-500/10 text-purple-700 border-purple-200",
    Resolved: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    Closed: "bg-gray-500/10 text-gray-700 border-gray-200",
  };

  return (
    <div className="dashboard-container space-y-5">
      {/* Student Welcome & Profile Strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Student Member Portal</span>
            {profile.is_pgimer_student ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-700 border-blue-200">
                PGIMER Scholar
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-700 border-purple-200">
                {profile.institution_name || "Outside Member"}
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl mt-0.5">
            Welcome, {profile.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {profile.course || profile.department || "Allied Health Sciences"} {profile.batch_year ? `· Batch ${profile.batch_year}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs px-2.5 py-1 font-semibold ${
              profile.membership_status === "Approved"
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-300"
                : profile.membership_status === "Rejected"
                ? "bg-rose-500/10 text-rose-700 border-rose-300"
                : "bg-amber-500/10 text-amber-700 border-amber-300"
            }`}
          >
            {profile.membership_status === "Approved"
              ? "Verified Member ✓"
              : profile.membership_status === "Rejected"
              ? "Application Rejected"
              : "Verification Pending"}
          </Badge>
          <Button variant="outline" size="sm" render={<Link href="/profile" className="text-xs font-medium" />}>
            My Profile
          </Button>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/dashboard/student/notices">
          <Card className="p-3.5 border-border shadow-2xs hover:border-primary/40 hover:bg-secondary/25 transition-all">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 mb-2">
              <Bell className="size-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">Notices & Circulars</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Announcements & docs</p>
          </Card>
        </Link>

        <Link href="/dashboard/student/events">
          <Card className="p-3.5 border-border shadow-2xs hover:border-primary/40 hover:bg-secondary/25 transition-all">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 mb-2">
              <Calendar className="size-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">Events & Workshops</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Register for sessions</p>
          </Card>
        </Link>

        <Link href="/dashboard/student/library">
          <Card className="p-3.5 border-border shadow-2xs hover:border-primary/40 hover:bg-secondary/25 transition-all">
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 mb-2">
              <BookOpen className="size-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">E-Library & Notes</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Curated study material</p>
          </Card>
        </Link>

        <Link href="/dashboard/student/grievances">
          <Card className="p-3.5 border-border shadow-2xs hover:border-primary/40 hover:bg-secondary/25 transition-all">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 mb-2">
              <ClipboardList className="size-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">Grievances & Help</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Track submitted queries</p>
          </Card>
        </Link>
      </div>

      {/* 2-Column: Latest Notices & Upcoming Events */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Latest Notices Card */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <span>Latest Notices & Announcements</span>
            </CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/dashboard/student/notices" className="text-xs text-primary font-medium" />}>
              View all <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {notices && notices.length > 0 ? (
              notices.map((n) => (
                <Link
                  key={n.id}
                  href="/dashboard/student/notices"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{n.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {n.category} · {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {n.is_pinned && (
                    <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700">
                      Pinned
                    </Badge>
                  )}
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No active notices available at this moment.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events Card */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span>Upcoming SAAHS Events</span>
            </CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/dashboard/student/events" className="text-xs text-primary font-medium" />}>
              Explore <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {events && events.length > 0 ? (
              events.map((e) => (
                <Link
                  key={e.id}
                  href="/dashboard/student/events"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{e.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(e.schedule).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} · {e.venue}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                    {e.category}
                  </Badge>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No upcoming events scheduled right now.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grievance Ticket Tracker for this student */}
      {myTickets && myTickets.length > 0 && (
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/70 px-4 py-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" />
              <span>My Grievance Tickets</span>
            </CardTitle>
            <Button variant="ghost" size="sm" render={<Link href="/dashboard/student/grievances" className="text-xs text-primary font-medium" />}>
              Track all <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/60">
            {myTickets.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{t.ticket_number}</p>
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] px-2 py-0.5 ${statusColor[t.status] ?? ""}`}>
                  {t.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
