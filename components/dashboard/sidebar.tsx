"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand-mark";
import {
  LayoutDashboard,
  Users,
  Bell,
  Calendar,
  BookOpen,
  ClipboardList,
} from "lucide-react";

const studentLinks = [
  { href: "/dashboard/student", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/student/notices", label: "Notices", icon: Bell },
  { href: "/dashboard/student/events", label: "Events", icon: Calendar },
  { href: "/dashboard/student/grievances", label: "Grievances", icon: ClipboardList },
];

const adminLinks = [
  { href: "/dashboard/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/admin/memberships", label: "Memberships", icon: Users },
  { href: "/dashboard/admin/notices", label: "Notices", icon: Bell },
  { href: "/dashboard/admin/events", label: "Events", icon: Calendar },
  { href: "/dashboard/admin/grievances", label: "Grievances", icon: ClipboardList },
  { href: "/dashboard/admin/library", label: "Library", icon: BookOpen },
];

export function DashboardSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? adminLinks : studentLinks;

  const isActive = (href: string) => {
    if (href === "/dashboard/admin" || href === "/dashboard/student") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
        <BrandMark />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {isAdmin ? "Admin Modules" : "Dashboard"}
        </p>
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
