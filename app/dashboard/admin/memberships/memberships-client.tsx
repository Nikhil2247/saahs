"use client";

import { useTransition } from "react";
import { updateMemberRole, deleteMember } from "@/app/actions/admin/memberships";
import { reviewMembership } from "@/app/actions/memberships";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoreHorizontal,
  ShieldAlert,
  Trash,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Search,
  IdCard,
  Building,
  GraduationCap,
  CreditCard,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useCallback } from "react";

export type ProfileDB = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  membership_status: string;
  department: string | null;
  course: string | null;
  institution_name: string | null;
  is_pgimer_student: boolean | null;
  membership_payment_status: string | null;
  id_card_url: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean | null;
  created_at: string;
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

export function MembershipsClient({
  profiles,
  page,
  totalPages,
  search,
  status,
  totalCount,
}: {
  profiles: ProfileDB[];
  page: number;
  totalPages: number;
  search: string;
  status: string;
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [editingRole, setEditingRole] = useState<ProfileDB | null>(null);
  const [selectedRoleValue, setSelectedRoleValue] = useState<string>("");
  const [viewingIdCard, setViewingIdCard] = useState<ProfileDB | null>(null);
  const [deletingMember, setDeletingMember] = useState<ProfileDB | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewing, startReviewing] = useTransition();

  // Local search input (debounced push to URL)
  const [localSearch, setLocalSearch] = useState(search);

  // Build URL with updated params while preserving others
  const buildUrl = useCallback(
    (overrides: Record<string, string | number>) => {
      const params = new URLSearchParams();
      const merged = { search, status, page, ...overrides };
      if (merged.search) params.set("search", String(merged.search));
      if (merged.status && merged.status !== "all") params.set("status", String(merged.status));
      if (Number(merged.page) > 1) params.set("page", String(merged.page));
      const qs = params.toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [search, status, page, pathname]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ search: localSearch, page: 1 }));
  };

  const handleStatusChange = (newStatus: string) => {
    router.push(buildUrl({ status: newStatus, page: 1 }));
  };

  const handleReview = (profile: ProfileDB, decision: "Approved" | "Rejected") => {
    startReviewing(async () => {
      const result = await reviewMembership(profile.id, decision);
      if (result.success) {
        toast.success(`Membership application ${decision.toLowerCase()}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update membership status");
      }
    });
  };

  const handleOpenEditRole = (profile: ProfileDB) => {
    setEditingRole(profile);
    setSelectedRoleValue(profile.role);
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("role", selectedRoleValue);
    const result = await updateMemberRole(editingRole.id, formData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Member role updated");
      setEditingRole(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update role");
    }
  };

  const handleDelete = async () => {
    if (!deletingMember) return;
    setIsSubmitting(true);
    const result = await deleteMember(deletingMember.id);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Member record removed");
      setDeletingMember(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove member");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls Strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Member Directory</h2>
          <p className="text-xs text-muted-foreground">
            Manage registrations, verify PGIMER students &amp; outside delegates, update leadership roles.
            Only users who completed their profile onboarding are shown here.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-1.5 border border-border">
          <Users className="size-3.5 shrink-0" />
          <span><strong className="text-foreground">{totalCount}</strong> onboarded {totalCount === 1 ? "member" : "members"}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2.5 rounded-lg border border-border">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, email, or course..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
          <Button type="submit" size="sm" className="h-8 px-3 text-xs shrink-0">
            Search
          </Button>
          {(localSearch || search) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs shrink-0"
              onClick={() => {
                setLocalSearch("");
                router.push(buildUrl({ search: "", page: 1 }));
              }}
            >
              <X className="size-3" />
            </Button>
          )}
        </form>

        <Tabs value={status} onValueChange={handleStatusChange} className="w-auto">
          <TabsList className="h-8 p-0.5">
            <TabsTrigger value="all" className="text-xs px-2.5 h-7">All</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-2.5 h-7">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="text-xs px-2.5 h-7">Approved</TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs px-2.5 h-7">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Members Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold py-2.5">Member Details</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Discipline / Course</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Institution / Type</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Assigned Role</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Status &amp; Fee</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                  No member records found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id} className="hover:bg-muted/30">
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8 border border-border">
                        <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {profile.full_name?.charAt(0) || "M"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate max-w-[160px]">
                          {profile.full_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                          {profile.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="py-2.5">
                    <div className="text-xs font-medium text-foreground truncate max-w-[140px]">
                      {profile.course || profile.department || "—"}
                    </div>
                  </TableCell>

                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      {profile.is_pgimer_student ? (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-700 border-blue-200">
                          <GraduationCap className="mr-1 size-3" /> PGIMER
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-700 border-purple-200 truncate max-w-[130px]">
                          <Building className="mr-1 size-3 shrink-0" />
                          <span className="truncate">{profile.institution_name || "Outside"}</span>
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-2.5">
                    <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0.5">
                      {profile.role}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-2.5">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 ${
                          profile.membership_status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-200 font-semibold"
                            : profile.membership_status === "Rejected"
                            ? "bg-rose-500/10 text-rose-700 border-rose-200"
                            : "bg-amber-500/10 text-amber-700 border-amber-200 font-semibold"
                        }`}
                      >
                        {profile.membership_status}
                      </Badge>
                      {profile.membership_payment_status && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <CreditCard className="size-2.5" />
                          {profile.membership_payment_status === "paid" ? "₹350 Paid" : profile.membership_payment_status}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {profile.id_card_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          title="View Uploaded ID Card"
                          onClick={() => setViewingIdCard(profile)}
                        >
                          <IdCard className="size-3.5" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" className="h-7 w-7 p-0">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuGroup>
                            {profile.membership_status === "Pending" && (
                              <>
                                <DropdownMenuItem
                                  disabled={isReviewing}
                                  onClick={() => handleReview(profile, "Approved")}
                                  className="text-emerald-700 focus:text-emerald-700 cursor-pointer"
                                >
                                  <Check className="mr-2 size-3.5" /> Approve Membership
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={isReviewing}
                                  onClick={() => handleReview(profile, "Rejected")}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <X className="mr-2 size-3.5" /> Reject Membership
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem onClick={() => handleOpenEditRole(profile)} className="cursor-pointer">
                              <ShieldAlert className="mr-2 size-3.5" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingMember(profile)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash className="mr-2 size-3.5" /> Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Server-side Pagination */}
        <div className="flex items-center justify-between py-2.5 px-4 border-t border-border bg-muted/10">
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages} &bull; {totalCount} total
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

      {/* ID Card Modal */}
      <Dialog open={!!viewingIdCard} onOpenChange={(open) => !open && setViewingIdCard(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <IdCard className="size-4 text-primary" />
              <span>Identity Proof: {viewingIdCard?.full_name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {viewingIdCard?.id_card_url ? (
              <div className="overflow-hidden rounded-lg border border-border bg-black/5 flex items-center justify-center max-h-80">
                <img
                  src={viewingIdCard.id_card_url}
                  alt={`ID Card for ${viewingIdCard.full_name}`}
                  className="object-contain max-h-80 w-full"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">No ID Card image available.</p>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setViewingIdCard(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Assign Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateRole} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Target User: <strong className="text-foreground">{editingRole?.full_name}</strong>
              </label>
              <select
                value={selectedRoleValue}
                onChange={(e) => setSelectedRoleValue(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ALL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingRole(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Save Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation */}
      <Dialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-destructive">Remove Member Record</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to remove <strong>{deletingMember?.full_name}</strong>? This action will revoke their portal access.
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeletingMember(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              Confirm Removal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
