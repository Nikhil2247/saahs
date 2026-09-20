"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Building,
  Users,
  Filter,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

export type UserDB = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  course: string | null;
  institution_name: string | null;
  is_pgimer_student: boolean | null;
  avatar_url: string | null;
  onboarding_complete: boolean | null;
  membership_status: string | null;
  created_at: string;
  batch_year?: string | null;
};

const ALL_ROLES = [
  "President",
  "Vice President",
  "General Secretary",
  "Treasurer",
  "Literary Secretary",
  "Governing Body Member",
  "Executive Body Member",
  "Faculty",
  "PGIMER Student",
  "Outside Member",
  "SAAHS Member",
  "Public User",
];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function UsersClient({
  users,
  page,
  totalPages,
  search,
  onboarded,
  totalCount,
  deptFilter,
  roleFilter,
  batchFilter,
  pageSize,
}: {
  users: UserDB[];
  page: number;
  totalPages: number;
  search: string;
  onboarded: string;
  totalCount: number;
  deptFilter: string;
  roleFilter: string;
  batchFilter: string;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [localSearch, setLocalSearch] = useState(search);
  const [localDept, setLocalDept] = useState(deptFilter);
  const [localBatch, setLocalBatch] = useState(batchFilter);

  const buildUrl = useCallback(
    (overrides: Record<string, string | number>) => {
      const params = new URLSearchParams();
      const merged = {
        search,
        onboarded,
        page,
        dept: deptFilter,
        role: roleFilter,
        batch: batchFilter,
        pageSize,
        ...overrides,
      };
      if (merged.search) params.set("search", String(merged.search));
      if (merged.onboarded && merged.onboarded !== "all") params.set("onboarded", String(merged.onboarded));
      if (Number(merged.page) > 1) params.set("page", String(merged.page));
      if (merged.dept) params.set("dept", String(merged.dept));
      if (merged.role) params.set("role", String(merged.role));
      if (merged.batch) params.set("batch", String(merged.batch));
      if (Number(merged.pageSize) !== 20) params.set("pageSize", String(merged.pageSize));
      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [search, onboarded, page, deptFilter, roleFilter, batchFilter, pageSize, pathname]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ search: localSearch, dept: localDept, batch: localBatch, page: 1 }));
  };

  const clearAllFilters = () => {
    setLocalSearch("");
    setLocalDept("");
    setLocalBatch("");
    router.push(pathname);
  };

  const hasActiveFilters = search || deptFilter || roleFilter || batchFilter || onboarded !== "all";

  const handleOnboardedChange = (val: string) => {
    router.push(buildUrl({ onboarded: val, page: 1 }));
  };

  const handleRoleFilterChange = (val: string | null) => {
    router.push(buildUrl({ role: val === "all" || !val ? "" : val, page: 1 }));
  };

  const handlePageSizeChange = (val: string | null) => {
    if (!val) return;
    router.push(buildUrl({ pageSize: Number(val), page: 1 }));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">All Users</h2>
          <p className="text-xs text-muted-foreground">
            View all registered users and their onboarding status. Use the Memberships page to manage membership applications.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-500/10 rounded-md px-3 py-1.5 border border-emerald-200">
            <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong className="text-emerald-700">{users.filter((u) => u.onboarding_complete).length}</strong>
              {" "}onboarded on this page
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-1.5 border border-border">
            <Users className="size-3.5 shrink-0" />
            <span><strong className="text-foreground">{totalCount}</strong> total users</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-lg border border-border bg-card p-3 space-y-3">
        {/* Search row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-2 items-end">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search name, email, course..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          <div className="relative min-w-[140px]">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Filter by dept..."
              value={localDept}
              onChange={(e) => setLocalDept(e.target.value)}
              className="pl-7 h-8 text-xs bg-background"
            />
          </div>

          <div className="min-w-[110px]">
            <Input
              placeholder="Batch year..."
              value={localBatch}
              onChange={(e) => setLocalBatch(e.target.value)}
              className="h-8 text-xs bg-background"
            />
          </div>

          <Button type="submit" size="sm" className="h-8 px-3 text-xs shrink-0">
            Apply
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs shrink-0"
              onClick={clearAllFilters}
            >
              <X className="size-3 mr-1" /> Clear
            </Button>
          )}
        </form>

        {/* Second row: Role filter + Onboarding tabs + Page size */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={roleFilter || "all"} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="h-8 text-xs w-[170px] bg-background">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Roles</SelectItem>
                {ALL_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={onboarded} onValueChange={handleOnboardedChange} className="w-auto">
              <TabsList className="h-8 p-0.5">
                <TabsTrigger value="all" className="text-xs px-2.5 h-7">All Users</TabsTrigger>
                <TabsTrigger value="yes" className="text-xs px-2.5 h-7">
                  <CheckCircle2 className="size-3 mr-1 text-emerald-600" />
                  Onboarded
                </TabsTrigger>
                <TabsTrigger value="no" className="text-xs px-2.5 h-7">
                  <AlertCircle className="size-3 mr-1 text-amber-500" />
                  Not Onboarded
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <span>Show</span>
            <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[70px] text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>per page</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold py-2.5">User</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Dept / Course / Batch</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Institution</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Role</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Membership</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Onboarding</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-xs text-muted-foreground">
                  No users found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  {/* User */}
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 border border-border">
                        <AvatarImage src={user.avatar_url || ""} alt={user.full_name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {user.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                          {user.full_name || <span className="italic text-muted-foreground">No name set</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Course / Dept / Batch */}
                  <TableCell className="py-2.5">
                    <div className="space-y-0.5">
                      <div className="text-xs text-foreground truncate max-w-[130px]">
                        {user.course || user.department || (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </div>
                      {user.batch_year && (
                        <div className="text-[10px] text-muted-foreground">
                          Batch {user.batch_year}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Institution */}
                  <TableCell className="py-2.5">
                    {user.is_pgimer_student ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-700 border-blue-200">
                        <GraduationCap className="mr-1 size-3" /> PGIMER
                      </Badge>
                    ) : user.institution_name ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-700 border-purple-200 max-w-[120px] truncate">
                        <Building className="mr-1 size-3 shrink-0" />
                        <span className="truncate">{user.institution_name}</span>
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">—</span>
                    )}
                  </TableCell>

                  {/* Role */}
                  <TableCell className="py-2.5">
                    <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
                      {user.role}
                    </Badge>
                  </TableCell>

                  {/* Membership Status */}
                  <TableCell className="py-2.5">
                    {user.membership_status ? (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 ${
                          user.membership_status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 font-semibold"
                            : user.membership_status === "Rejected"
                            ? "bg-rose-500/10 text-rose-700 border-rose-200"
                            : user.membership_status === "Pending"
                            ? "bg-amber-500/10 text-amber-700 border-amber-200"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {user.membership_status}
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">None</span>
                    )}
                  </TableCell>

                  {/* Onboarding Badge */}
                  <TableCell className="py-2.5">
                    {user.onboarding_complete ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-semibold text-emerald-700">Onboarded</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="size-3.5 text-amber-500 shrink-0" />
                        <span className="text-[11px] font-semibold text-amber-600">Not Onboarded</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Joined date */}
                  <TableCell className="py-2.5">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between py-2.5 px-4 border-t border-border bg-muted/10">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages} &bull; {totalCount} total users
            {hasActiveFilters && (
              <span className="ml-1 text-primary font-medium">(filtered)</span>
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => router.push(buildUrl({ page: page - 1 }))}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-3.5 mr-1" /> Prev
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => router.push(buildUrl({ page: p }))}
                >
                  {p}
                </Button>
              );
            })}
            {totalPages > 5 && <span className="text-xs text-muted-foreground px-1">...</span>}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => router.push(buildUrl({ page: page + 1 }))}
              disabled={page >= totalPages}
            >
              Next <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
