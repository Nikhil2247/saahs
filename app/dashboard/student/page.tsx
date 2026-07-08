/**
 * app/dashboard/student/page.tsx
 *
 * Student Dashboard — shown to authenticated users with role SAAHS Member
 * (or Public User during the pending membership period).
 *
 * Reads the real Supabase session server-side and passes profile data
 * down as props.
 */

import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  Bell,
  Calendar,
  FileText,
  Users,
  ArrowRight,
  Clock,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
          catch { /* ignored in server component */ }
        },
      },
    }
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const supabase = await getServerClient();

  // Verify session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, department, course, batch_year, roll_number, role, membership_status, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile?.full_name) redirect("/onboarding");

  // Fetch latest 5 notices
  const { data: notices } = await supabase
    .from("notices")
    .select("id, title, category, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch upcoming events
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
    .select("ticket_number, title, status, created_at")
    .eq("user_id", user.id)
    .eq("is_anonymous", false)
    .order("created_at", { ascending: false })
    .limit(3);

  const statusColor: Record<string, string> = {
    Submitted: "bg-blue-500/10 text-blue-600",
    "Under Review": "bg-yellow-500/10 text-yellow-600",
    "In Progress": "bg-purple-500/10 text-purple-600",
    Resolved: "bg-green-500/10 text-green-600",
    Closed: "bg-gray-500/10 text-gray-600",
  };

  const membershipColor: Record<string, string> = {
    Pending: "bg-yellow-500/10 text-yellow-600",
    Approved: "bg-green-500/10 text-green-600",
    Rejected: "bg-red-500/10 text-red-600",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* ── Welcome header ── */}
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {profile.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile.department} · {profile.course} · Batch {profile.batch_year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              membershipColor[profile.membership_status] ?? "bg-secondary text-foreground"
            }`}
          >
            {profile.membership_status === "Pending"
              ? "Membership Pending"
              : profile.membership_status === "Approved"
              ? "SAAHS Member ✓"
              : "Membership Rejected"}
          </span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "My Notices", value: notices?.length ?? 0, icon: Bell, href: "/notices" },
          { label: "Upcoming Events", value: events?.length ?? 0, icon: Calendar, href: "/notices" },
          { label: "My Tickets", value: myTickets?.length ?? 0, icon: FileText, href: "/help-desk" },
          { label: "Department", value: profile.department?.split(" ")[0] ?? "—", icon: GraduationCap, href: "/departments" },
        ].map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="flex items-center gap-4 border-border p-5 transition-colors hover:border-primary/40 hover:bg-secondary/30">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Latest Notices ── */}
        <Card className="border-border">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Bell className="size-4" /> Latest Notices
            </h2>
            <Link href="/notices" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {notices && notices.length > 0 ? (
              notices.map((n) => (
                <div key={n.id} className="px-6 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{n.title}</p>
                    {n.is_pinned && (
                      <Badge className="shrink-0 text-[10px]">Pinned</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(n.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No notices yet.</p>
            )}
          </div>
        </Card>

        {/* ── Upcoming Events ── */}
        <Card className="border-border">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="size-4" /> Upcoming Events
            </h2>
          </div>
          <div className="divide-y divide-border">
            {events && events.length > 0 ? (
              events.map((ev) => (
                <div key={ev.id} className="px-6 py-3.5">
                  <p className="text-sm font-medium text-foreground line-clamp-1">{ev.title}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{new Date(ev.schedule).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    <span>·</span>
                    <span>{ev.venue}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No upcoming events.</p>
            )}
          </div>
        </Card>

        {/* ── My Grievance Tickets ── */}
        <Card className="border-border lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="size-4" /> My Help Desk Tickets
            </h2>
            <Link href="/help-desk" className="text-xs text-primary hover:underline flex items-center gap-1">
              Raise ticket <ArrowRight className="size-3" />
            </Link>
          </div>
          {myTickets && myTickets.length > 0 ? (
            <div className="divide-y divide-border">
              {myTickets.map((t) => (
                <div key={t.ticket_number} className="flex items-center justify-between gap-4 px-6 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.ticket_number}</p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColor[t.status] ?? "bg-secondary text-foreground"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No tickets raised yet.{" "}
              <Link href="/help-desk" className="text-primary hover:underline">
                Submit a grievance
              </Link>
            </p>
          )}
        </Card>
      </div>

      {/* ── Membership CTA ── */}
      {profile.membership_status === "Pending" && (
        <Card className="mt-6 flex flex-col items-center gap-3 border-border bg-secondary/30 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Users className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Membership Under Review</p>
            <p className="text-sm text-muted-foreground">
              Your SAAHS membership application is being reviewed. You&apos;ll gain full access once approved.
            </p>
          </div>
          <Link href="/help-desk">
            <Button variant="outline" size="sm">Track status</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
