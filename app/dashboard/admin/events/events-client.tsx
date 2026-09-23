"use client"

import { useState } from "react"
import { createEvent, updateEvent, deleteEvent } from "@/app/actions/admin/events"
import { getEventRegistrations, EventRegistrationDetail } from "@/app/actions/admin/event-registrations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash,
  ChevronLeft,
  ChevronRight,
  Users,
  Download,
  Trophy,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type EventDB = {
  id: string
  title: string
  description: string
  event_type: string
  start_time: string
  end_time: string
  location: string
  image_url: string | null
  created_at: string
}

function exportToCSV(registrations: EventRegistrationDetail[], eventTitle: string) {
  const headers = [
    "Name",
    "Roll Number",
    "Department / Course",
    "Batch Year",
    "Phone",
    "Sports / Events",
    "Waiver Accepted",
    "Registered At",
  ]

  const rows = registrations.map((r) => [
    r.profile.full_name ?? "",
    r.profile.roll_number ?? "",
    [r.profile.course, r.profile.department].filter(Boolean).join(" / "),
    r.profile.batch_year ?? "",
    r.phone_number ?? "",
    r.sport_choices.join("; "),
    r.waiver_accepted ? "Yes" : "No",
    new Date(r.registered_at).toLocaleString(),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${eventTitle.replace(/\s+/g, "_")}_registrations.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function EventsClient({
  events,
  page,
  totalPages,
}: {
  events: EventDB[]
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventDB | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<EventDB | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Registrations viewer state
  const [viewingEvent, setViewingEvent] = useState<EventDB | null>(null)
  const [registrations, setRegistrations] = useState<EventRegistrationDetail[]>([])
  const [regsLoading, setRegsLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await createEvent(formData)
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Event created successfully")
      setIsCreateOpen(false)
    } else {
      toast.error(result.error || "Failed to create event")
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingEvent) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateEvent(editingEvent.id, formData)
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Event updated successfully")
      setEditingEvent(null)
    } else {
      toast.error(result.error || "Failed to update event")
    }
  }

  const handleDelete = async () => {
    if (!deletingEvent) return
    setIsSubmitting(true)
    const result = await deleteEvent(deletingEvent.id)
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Event deleted successfully")
      setDeletingEvent(null)
    } else {
      toast.error(result.error || "Failed to delete event")
    }
  }

  const handleViewRegistrations = async (event: EventDB) => {
    setViewingEvent(event)
    setRegsLoading(true)
    const result = await getEventRegistrations(parseInt(event.id))
    setRegsLoading(false)
    if (result.success && result.data) {
      setRegistrations(result.data)
    } else {
      toast.error(result.error || "Failed to load registrations")
      setRegistrations([])
    }
  }

  const formatDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Events Management</h2>
          <p className="text-muted-foreground">
            Create and manage upcoming events and activities.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="h-8 text-xs font-medium"
        >
          <Plus className="mr-1.5 size-3.5" /> Add Event
        </Button>
      </div>

      {/* Events Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs font-semibold py-2.5">Title</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Type</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Start Time</TableHead>
              <TableHead className="text-xs font-semibold py-2.5">Location</TableHead>
              <TableHead className="text-xs font-semibold py-2.5 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-28 text-center text-xs text-muted-foreground"
                >
                  No events found.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium max-w-[200px] truncate py-2.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      {event.event_type === "Sports" && (
                        <Trophy className="size-3 text-amber-500 shrink-0" />
                      )}
                      {event.title}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        event.event_type === "Sports"
                          ? "bg-amber-500/10 text-amber-700 border-amber-300"
                          : ""
                      }`}
                    >
                      {event.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-2.5 text-xs text-muted-foreground">
                    {new Date(event.start_time).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="truncate max-w-[150px] py-2.5 text-xs">
                    {event.location}
                  </TableCell>
                  <TableCell className="text-right py-2.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" className="h-7 w-7 p-0">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => handleViewRegistrations(event)}
                          >
                            <Users className="mr-2 h-4 w-4" /> View Registrations
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingEvent(event)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingEvent(event)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/dashboard/admin/events?page=${page - 1}`)
              }
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/dashboard/admin/events?page=${page + 1}`)
              }
              disabled={page >= totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Registrations Viewer Dialog ──────────────────────────────── */}
      <Dialog
        open={!!viewingEvent}
        onOpenChange={(open) => !open && setViewingEvent(null)}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Registrations — {viewingEvent?.title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {regsLoading
                ? "Loading..."
                : `${registrations.length} student${registrations.length !== 1 ? "s" : ""} registered`}
            </p>
          </DialogHeader>

          {regsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground border rounded-lg border-border">
              No registrations yet.
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-semibold py-2">#</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Name</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Roll No.</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Dept / Course</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Batch</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Phone</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Sports</TableHead>
                    <TableHead className="text-xs font-semibold py-2 text-center">Waiver</TableHead>
                    <TableHead className="text-xs font-semibold py-2">Registered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg, idx) => (
                    <TableRow key={reg.id} className="hover:bg-muted/20">
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="py-2 text-xs font-medium max-w-[130px] truncate">
                        {reg.profile.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground font-mono">
                        {reg.profile.roll_number ?? "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground max-w-[120px] truncate">
                        {reg.profile.course || reg.profile.department || "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {reg.profile.batch_year ?? "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {reg.phone_number ?? "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        {reg.sport_choices.length > 0 ? (
                          <div className="flex flex-wrap gap-0.5 max-w-[160px]">
                            {reg.sport_choices.map((s) => (
                              <Badge
                                key={s}
                                className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-700 border border-amber-200"
                              >
                                {s}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {reg.waiver_accepted ? (
                          <CheckCircle2 className="size-3.5 text-emerald-600 mx-auto" />
                        ) : (
                          <XCircle className="size-3.5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(reg.registered_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewingEvent(null)}
            >
              Close
            </Button>
            {!regsLoading && registrations.length > 0 && (
              <Button
                size="sm"
                variant="default"
                className="gap-1.5"
                onClick={() =>
                  exportToCSV(registrations, viewingEvent?.title ?? "event")
                }
              >
                <Download className="size-3.5" />
                Export CSV
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" required placeholder="Event title..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  name="event_type"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Academic">Academic</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Literary">Literary</option>
                  <option value="Workshops">Workshops</option>
                  <option value="Conferences">Conferences</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input name="location" required placeholder="Venue or Link" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input type="datetime-local" name="start_time" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input type="datetime-local" name="end_time" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Banner (Optional)</label>
              <Input type="file" name="image_file" accept="image/*" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                required
                rows={4}
                placeholder="Event details..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Organizer Info (Optional)</label>
              <Input name="organizer_info" placeholder="e.g. SAAHS Sports Committee" />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────── */}
      <Dialog
        open={!!editingEvent}
        onOpenChange={(open) => !open && setEditingEvent(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                name="title"
                defaultValue={editingEvent?.title}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  name="event_type"
                  defaultValue={editingEvent?.event_type}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Academic">Academic</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Literary">Literary</option>
                  <option value="Workshops">Workshops</option>
                  <option value="Conferences">Conferences</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input
                  name="location"
                  defaultValue={editingEvent?.location}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <Input
                  type="datetime-local"
                  name="start_time"
                  defaultValue={
                    editingEvent ? formatDateTimeLocal(editingEvent.start_time) : ""
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <Input
                  type="datetime-local"
                  name="end_time"
                  defaultValue={
                    editingEvent ? formatDateTimeLocal(editingEvent.end_time) : ""
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Banner URL</label>
              <Input
                name="image_url"
                defaultValue={editingEvent?.image_url || ""}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Replace Banner (Optional)</label>
              <Input type="file" name="image_file" accept="image/*" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                defaultValue={editingEvent?.description}
                required
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingEvent(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!deletingEvent}
        onOpenChange={(open) => !open && setDeletingEvent(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Event</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to delete the event{" "}
            <strong>{deletingEvent?.title}</strong>? This action cannot be
            undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingEvent(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
