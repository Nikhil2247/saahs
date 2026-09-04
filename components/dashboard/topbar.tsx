"use client";

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
import { LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";

interface DashboardTopbarProps {
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

export function DashboardTopbar({ user }: DashboardTopbarProps) {
  const pathname = usePathname();

  // Simple logic to extract a readable title from the pathname
  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1];
  let title = "Overview";
  
  if (currentSegment && currentSegment !== "admin" && currentSegment !== "student") {
    title = currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1);
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/95 px-6 backdrop-blur supports-backdrop-filter:bg-card/80">
      <div className="flex items-center gap-4">
        {/* Mobile menu button could go here if we implement a mobile sidebar drawer */}
        <Button variant="ghost" size="icon" className="lg:hidden mr-2">
          <Menu className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground capitalize">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 w-9 rounded-full" />}>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatarUrl ?? ""} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" className="cursor-pointer" />}>
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
