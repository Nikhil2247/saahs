"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LogOut, Menu, User, ShieldCheck, GraduationCap, ChevronRight } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { SidebarNavContent } from "./sidebar";
import { BrandMark } from "@/components/brand-mark";

interface DashboardTopbarProps {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
    role?: string;
  };
  isAdmin: boolean;
}

const routeTitles: Record<string, string> = {
  admin: "Admin Overview",
  student: "Member Dashboard",
  memberships: "Membership Applications",
  notices: "Notices & Minutes",
  events: "Events & Schedules",
  grievances: "Grievance Redressal",
  library: "E-Library & Resources",
  meetings: "Meeting Minutes & Records",
  institutions: "Institutional Directory",
};

export function DashboardTopbar({ user, isAdmin }: DashboardTopbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1] ?? "";
  const pageTitle = routeTitles[currentSegment] || (currentSegment ? currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1) : "Overview");

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 md:px-6 backdrop-blur supports-backdrop-filter:bg-card/85">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger sheet */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open navigation menu">
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0 flex flex-col h-full bg-card">
              <div className="flex h-14 shrink-0 items-center border-b border-border px-5">
                <BrandMark />
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarNavContent isAdmin={isAdmin} userRole={user.role} onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Breadcrumb path */}
        <div className="flex items-center gap-2 text-xs md:text-sm">
          <span className="hidden sm:inline text-muted-foreground font-medium">
            {isAdmin ? "SAAHS Admin" : "SAAHS Portal"}
          </span>
          <ChevronRight className="hidden sm:inline size-3.5 text-muted-foreground/60" />
          <h1 className="font-semibold text-foreground tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        {user.role && (
          <Badge
            variant="secondary"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium py-0.5 px-2.5 bg-secondary/80 text-foreground"
          >
            {isAdmin ? (
              <ShieldCheck className="size-3 text-primary" />
            ) : (
              <GraduationCap className="size-3 text-primary" />
            )}
            <span>{user.role}</span>
          </Badge>
        )}

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-9 w-9 border border-border/80">
                  <AvatarImage src={user.avatarUrl ?? ""} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent className="w-56 p-1.5" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-semibold leading-none text-foreground">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                  {user.role && (
                    <span className="text-[11px] font-medium text-primary mt-1">{user.role}</span>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem render={<Link href="/profile" className="flex items-center gap-2 cursor-pointer w-full text-xs font-medium" />}>
              <User className="size-3.5 text-muted-foreground" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 text-xs font-medium"
            >
              <LogOut className="size-3.5" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
