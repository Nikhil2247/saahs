"use client";

import { useState } from "react";
import { createMeeting, updateMeeting, deleteMeeting } from "@/app/actions/admin/meetings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash,
  FileText,
  Calendar,
  Eye,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { MeetingRow } from "@/types/database";

export function MeetingsClient({ meetings }: { meetings: MeetingRow[] }) {
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingMeeting, setViewingMeeting] = useState<MeetingRow | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<MeetingRow | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<MeetingRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createMeeting(formData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Meeting record created");
      setIsCreateOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to create meeting");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMeeting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateMeeting(editingMeeting.id, formData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Meeting record updated");
      setEditingMeeting(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update meeting");
    }
  };

  const handleDelete = async () => {
    if (!deletingMeeting) return;
    setIsSubmitting(true);
    const result = await deleteMeeting(deletingMeeting.id);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Meeting record deleted");
      setDeletingMeeting(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete meeting");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <span>Meetings & Official Minutes</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Schedule meetings, publish agendas, and document executive & general body minutes.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="h-8 text-xs">
          <Plus className="mr-1.5 size-3.5" /> Record Meeting
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold py-2.5">Notice Date</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Meeting Title</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Agenda</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Minutes Status</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                  No meeting records documented yet.
                </TableCell>
              </TableRow>
            ) : (
              meetings.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/30">
                  <TableCell className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Calendar className="size-3 text-muted-foreground" />
                      <span>{new Date(m.notice_date).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <span className="text-xs font-semibold text-foreground">{m.title}</span>
                  </TableCell>
                  <TableCell className="py-2.5 max-w-[240px]">
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {m.agenda || "No agenda specified"}
                    </span>
                  </TableCell>
                  <TableCell className="py-2.5">
                    {m.minutes_of_meeting ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 border-emerald-200 font-semibold">
                        Minutes Logged
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 border-amber-200">
                        Pending Minutes
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        title="View Minutes"
                        onClick={() => setViewingMeeting(m)}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" className="h-7 w-7 p-0">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-36 text-xs">
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => setEditingMeeting(m)} className="cursor-pointer">
                              <Pencil className="mr-2 size-3.5" /> Edit Record
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingMeeting(m)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash className="mr-2 size-3.5" /> Delete
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
      </div>

      {/* View Meeting Minutes Dialog */}
      <Dialog open={!!viewingMeeting} onOpenChange={(open) => !open && setViewingMeeting(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">{viewingMeeting?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <span className="font-semibold text-foreground">Date:</span>{" "}
              <span className="text-muted-foreground">{viewingMeeting?.notice_date}</span>
            </div>
            {viewingMeeting?.agenda && (
              <div className="rounded-md bg-muted/40 p-2.5 border border-border/70">
                <span className="font-semibold text-foreground block mb-1">Agenda:</span>
                <p className="text-muted-foreground whitespace-pre-wrap">{viewingMeeting.agenda}</p>
              </div>
            )}
            <div>
              <span className="font-semibold text-foreground block mb-1">Minutes of Meeting:</span>
              <div className="rounded-md bg-muted/30 p-3 border border-border max-h-60 overflow-y-auto scrollbar-thin">
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {viewingMeeting?.minutes_of_meeting || "Minutes have not been documented yet for this meeting."}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setViewingMeeting(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Meeting Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Record Meeting</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Meeting Title</label>
              <Input name="title" required placeholder="e.g. 14th Executive Committee Meeting" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Notice Date</label>
              <Input type="date" name="notice_date" required className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Agenda</label>
              <Textarea name="agenda" rows={2} placeholder="Meeting agenda topics..." className="text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Minutes of Meeting</label>
              <Textarea name="minutes_of_meeting" rows={4} placeholder="Key discussions, resolutions, and decisions..." className="text-xs" />
            </div>
            <DialogFooter>
              <Button type="button" size="sm" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Save Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog open={!!editingMeeting} onOpenChange={(open) => !open && setEditingMeeting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Meeting</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Meeting Title</label>
              <Input name="title" defaultValue={editingMeeting?.title} required className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Notice Date</label>
              <Input type="date" name="notice_date" defaultValue={editingMeeting?.notice_date} required className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Agenda</label>
              <Textarea name="agenda" defaultValue={editingMeeting?.agenda || ""} rows={2} className="text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Minutes of Meeting</label>
              <Textarea name="minutes_of_meeting" defaultValue={editingMeeting?.minutes_of_meeting || ""} rows={4} className="text-xs" />
            </div>
            <DialogFooter>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingMeeting(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Update Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingMeeting} onOpenChange={(open) => !open && setDeletingMeeting(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-destructive">Delete Meeting Record</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-2">
            Are you sure you want to delete this meeting record? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeletingMeeting(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
