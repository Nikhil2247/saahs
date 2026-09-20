"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Bell,
  Calendar,
  BookOpen,
  ClipboardList,
  Building2,
  FileText,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Crown,
  Shield,
  BookMarked,
} from "lucide-react";
import { getAllowedAdminRoutes, getRoleTier, isLeadership, isFaculty } from "@/lib/roles";

// ── All possible admin links ──────────────────────────────────────────────────

const ALL_ADMIN_LINKS = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/users", label: "Users", icon: UserCheck },
  { href: "/dashboard/admin/memberships", label: "Memberships", icon: Users },
  { href: "/dashboard/admin/notices", label: "Notices & Minutes", icon: Bell },
  { href: "/dashboard/admin/events", label: "Events", icon: Calendar },
  { href: "/dashboard/admin/grievances", label: "Grievances", icon: ClipboardList },
  { href: "/dashboard/admin/library", label: "E-Library", icon: BookOpen },
  { href: "/dashboard/admin/meetings", label: "Meetings & Minutes", icon: FileText },
  { href: "/dashboard/admin/institutions", label: "Institutions", icon: Building2 },
];

export const studentLinks = [
  { href: "/dashboard/student", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/student/notices", label: "Notices & Circulars", icon: Bell },
  { href: "/dashboard/student/events", label: "Events & Register", icon: Calendar },
  { href: "/dashboard/student/grievances", label: "Grievances & Help", icon: ClipboardList },
  { href: "/dashboard/student/library", label: "E-Library & Notes", icon: BookOpen },
];

// ── Role tier badge config ────────────────────────────────────────────────────

function getRoleBadgeConfig(role: string) {
  const tier = getRoleTier(role);
  switch (tier) {
    case "Leadership":
      return { label: "Leadership", icon: Crown, className: "text-amber-700 bg-amber-500/10 border-amber-300" };
    case "Governing Body":
      return { label: "Governing Body", icon: Shield, className: "text-blue-700 bg-blue-500/10 border-blue-300" };
    case "Executive Body":
      return { label: "Executive Body", icon: ShieldCheck, className: "text-purple-700 bg-purple-500/10 border-purple-300" };
    case "Faculty":
      return { label: "Faculty", icon: BookMarked, className: "text-emerald-700 bg-emerald-500/10 border-emerald-300" };
    default:
      return { label: "Member Portal", icon: GraduationCap, className: "text-muted-foreground" };
  }
}

// ── Sidebar nav content ───────────────────────────────────────────────────────

interface SidebarNavProps {
  isAdmin: boolean;
  userRole?: string;
  onNavigate?: () => void;
}

export function SidebarNavContent({ isAdmin, userRole = "", onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  // Compute which admin links are visible for this role
  const allowedRoutes = isAdmin ? getAllowedAdminRoutes(userRole) : [];
  const links = isAdmin
    ? ALL_ADMIN_LINKS.filter((l) => allowedRoutes.includes(l.href))
    : studentLinks;

  const badgeConfig = isAdmin ? getRoleBadgeConfig(userRole) : null;
  const BadgeIcon = badgeConfig?.icon;

  const isActive = (href: string) => {
    if (href === "/dashboard/admin" || href === "/dashboard/student") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col">
        {/* Workspace identifier tag */}
        <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            {BadgeIcon ? (
              <BadgeIcon className="size-4 text-primary shrink-0" />
            ) : (
              <GraduationCap className="size-4 text-primary shrink-0" />
            )}
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
              {isAdmin ? (badgeConfig?.label ?? "Admin") + " Portal" : "Student Member Portal"}
            </span>
          </div>
          {isAdmin && userRole && (
            <p className="text-[11px] text-muted-foreground mt-1 truncate pl-6">
              {userRole}
            </p>
          )}
        </div>

        {/* Nav links */}
        <ScrollArea className="flex-1 px-3 py-3">
          <nav className="flex flex-col gap-1">
            {links.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <link.icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span>{link.label}</span>
                  </div>
                  {active && (
                    <span className="size-1.5 rounded-full bg-primary-foreground animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      {/* Footer link to public site */}
      <div className="border-t border-border p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <span>SAAHS Public Portal</span>
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function DashboardSidebar({ isAdmin, userRole = "" }: { isAdmin: boolean; userRole?: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
        <BrandMark />
      </div>
      <div className="flex-1 overflow-hidden">
        <SidebarNavContent isAdmin={isAdmin} userRole={userRole} />
      </div>
    </aside>
  );
}
