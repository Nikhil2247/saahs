"use client"

import { useState } from "react"
import { createNotice, updateNotice, deleteNotice } from "@/app/actions/admin/notices"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  MoreHorizontal, Plus, Pencil, Trash, ChevronLeft, ChevronRight,
  Bell, FileText, BookOpen, ImageIcon, Eye, X,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { NoticeSection } from "@/types/database"

export type NoticeDB = {
  id: string
  title: string
  content: string
  category: string
  section: NoticeSection
  is_pinned: boolean
  image_url: string | null
  document_type: string | null
  created_at: string
}

type ActiveSection = "General" | "Letters & Minutes" | "Documents"

const SECTION_TABS: { key: ActiveSection; label: string; icon: React.ElementType; color: string }[] = [
  { key: "General",           label: "General Notices",      icon: Bell,      color: "text-blue-500"   },
  { key: "Letters & Minutes", label: "Letters & Minutes",    icon: FileText,  color: "text-violet-500" },
  { key: "Documents",         label: "Documents",            icon: BookOpen,  color: "text-emerald-500"},
]

const DOCUMENT_TYPES = ["Constitution", "Rules & Regulations", "Amendment", "Circular", "Policy", "Other"]

export function NoticesClient({
  notices, page, totalPages,
}: {
  notices: NoticeDB[]
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<ActiveSection>("General")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<NoticeDB | null>(null)
  const [deletingNotice, setDeletingNotice] = useState<NoticeDB | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const sectionNotices = notices.filter((n) => n.section === activeSection)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.set("section", activeSection)
    const result = await createNotice(formData)
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Entry created successfully")
      setIsCreateOpen(false)
    } else {
      toast.error(result.error || "Failed to create entry")
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingNotice) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.set("section", activeSection)
    formData.set("existing_image_url", editingNotice.image_url || "")
    const result = await updateNotice(editingNotice.id, formData)
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Entry updated")
      setEditingNotice(null)
    } else {
      toast.error(result.error || "Failed to update entry")
    }
  }

  const handleDelete = async () => {
    if (!deletingNotice) return
    setIsSubmitting(true)
    const result = await deleteNotice(deletingNotice.id)
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Deleted")
      setDeletingNotice(null)
    } else {
      toast.error(result.error || "Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notices Management</h2>
          <p className="text-muted-foreground">Manage notices across three sections.</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="h-8 text-xs font-medium">
          <Plus className="mr-1.5 size-3.5" />
          Add to {activeSection}
        </Button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {SECTION_TABS.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeSection === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`size-4 ${activeSection === key ? color : ""}`} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Section description */}
      <div className="rounded-lg border border-border bg-card/50 px-4 py-3 text-sm text-muted-foreground">
        {activeSection === "General" && "General announcements, academic notices, events, and circulars."}
        {activeSection === "Letters & Minutes" && "Official letters, meeting notices and minutes of meetings — upload images of scanned documents under a title."}
        {activeSection === "Documents" && "Founding documents, constitution, rules & regulations, and official amendments."}
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              {activeSection === "General" && <TableHead>Category</TableHead>}
              {activeSection === "General" && <TableHead>Pinned</TableHead>}
              {activeSection === "Letters & Minutes" && <TableHead>Image</TableHead>}
              {activeSection === "Documents" && <TableHead>Type</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectionNotices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No entries in this section yet.
                </TableCell>
              </TableRow>
            ) : (
              sectionNotices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium max-w-[220px] truncate">{notice.title}</TableCell>

                  {activeSection === "General" && (
                    <>
                      <TableCell><Badge variant="outline">{notice.category}</Badge></TableCell>
                      <TableCell>
                        {notice.is_pinned
                          ? <Badge className="bg-amber-500 hover:bg-amber-600">Pinned</Badge>
                          : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    </>
                  )}

                  {activeSection === "Letters & Minutes" && (
                    <TableCell>
                      {notice.image_url ? (
                        <button onClick={() => setPreviewImage(notice.image_url)} className="flex items-center gap-1 text-primary hover:underline text-sm">
                          <Eye className="size-3.5" /> View Image
                        </button>
                      ) : <span className="text-muted-foreground text-sm">No image</span>}
                    </TableCell>
                  )}

                  {activeSection === "Documents" && (
                    <TableCell>
                      {notice.document_type
                        ? <Badge variant="outline" className="border-emerald-500/50 text-emerald-600">{notice.document_type}</Badge>
                        : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                  )}

                  <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem onClick={() => setEditingNotice(notice)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingNotice(notice)} className="text-destructive focus:text-destructive">
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

        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/admin/notices?page=${page - 1}`)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="text-sm font-medium">Page {page} of {totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/admin/notices?page=${page + 1}`)} disabled={page >= totalPages}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* ── Create Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add to {activeSection === "General" ? "General Notices" : activeSection}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <input type="hidden" name="section" value={activeSection} />

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" required minLength={5} maxLength={255} placeholder="Title… (min 5 characters)" />
              <p className="text-[11px] text-muted-foreground">Minimum 5 characters required.</p>
            </div>

            {/* General: category + pinned + text content */}
            {activeSection === "General" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select name="category" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Event">Event</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Election">Election</option>
                    <option value="Circular">Circular</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_pinned" value="true" className="rounded border-input" />
                  <span className="font-medium">Pin this notice</span>
                </label>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea name="content" required rows={5} placeholder="Notice content…" />
                </div>
              </>
            )}

            {/* Letters & Minutes: image upload */}
            {activeSection === "Letters & Minutes" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <ImageIcon className="size-3.5" /> Upload Image (letter / minutes scan)
                  </label>
                  <Input type="file" name="image_file" accept="image/*" required />
                  <p className="text-xs text-muted-foreground">Upload a scanned image of the letter or meeting minutes.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea name="content" rows={3} placeholder="Brief description…" />
                </div>
              </>
            )}

            {/* Documents: type + file upload + description */}
            {activeSection === "Documents" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Type</label>
                  <select name="document_type" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <ImageIcon className="size-3.5" /> Upload Document Image / PDF Preview
                  </label>
                  <Input type="file" name="image_file" accept="image/*,application/pdf" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea name="content" rows={3} placeholder="Brief description of this document…" />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Publish</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={!!editingNotice} onOpenChange={(open) => !open && setEditingNotice(null)}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <input type="hidden" name="section" value={activeSection} />
            <input type="hidden" name="existing_image_url" value={editingNotice?.image_url || ""} />

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" defaultValue={editingNotice?.title} required minLength={5} maxLength={255} />
            </div>

            {activeSection === "General" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select name="category" defaultValue={editingNotice?.category} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Event">Event</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Election">Election</option>
                    <option value="Circular">Circular</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_pinned" value="true" defaultChecked={editingNotice?.is_pinned} className="rounded border-input" />
                  <span className="font-medium">Pin this notice</span>
                </label>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea name="content" defaultValue={editingNotice?.content} required rows={5} />
                </div>
              </>
            )}

            {activeSection === "Letters & Minutes" && (
              <>
                {editingNotice?.image_url && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Current Image</label>
                    <img src={editingNotice.image_url} alt="Current" className="max-h-32 rounded border object-contain" />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Replace Image (Optional)</label>
                  <Input type="file" name="image_file" accept="image/*" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea name="content" defaultValue={editingNotice?.content} rows={3} />
                </div>
              </>
            )}

            {activeSection === "Documents" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Type</label>
                  <select name="document_type" defaultValue={editingNotice?.document_type || ""} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                {editingNotice?.image_url && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Current File</label>
                    <a href={editingNotice.image_url} target="_blank" className="text-sm text-primary hover:underline">View current file</a>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Replace File (Optional)</label>
                  <Input type="file" name="image_file" accept="image/*,application/pdf" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea name="content" defaultValue={editingNotice?.content} rows={3} />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingNotice(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ────────────────────────────────────────────────────── */}
      <Dialog open={!!deletingNotice} onOpenChange={(open) => !open && setDeletingNotice(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Entry</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deletingNotice?.title}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingNotice(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Preview Modal ──────────────────────────────────────────────── */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              <X className="size-6" />
            </button>
            <img src={previewImage} alt="Preview" className="rounded-xl w-full object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}
