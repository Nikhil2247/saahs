"use client"

import { useState } from "react"
import { createNotice, updateNotice, deleteNotice } from "@/app/actions/admin/notices"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus, Pencil, Trash, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type NoticeDB = {
  id: string
  title: string
  content: string
  category: string
  attachment_url: string | null
  is_pinned: boolean
  created_at: string
}

export function NoticesClient({ 
  notices, 
  page, 
  totalPages 
}: { 
  notices: NoticeDB[]
  page: number
  totalPages: number 
}) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState<NoticeDB | null>(null)
  const [deletingNotice, setDeletingNotice] = useState<NoticeDB | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await createNotice(formData)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Notice created successfully")
      setIsCreateOpen(false)
    } else {
      toast.error(result.error || "Failed to create notice")
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingNotice) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateNotice(editingNotice.id, formData)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Notice updated successfully")
      setEditingNotice(null)
    } else {
      toast.error(result.error || "Failed to update notice")
    }
  }

  const handleDelete = async () => {
    if (!deletingNotice) return
    setIsSubmitting(true)
    const result = await deleteNotice(deletingNotice.id)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Notice deleted successfully")
      setDeletingNotice(null)
    } else {
      toast.error(result.error || "Failed to delete notice")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notices Management</h2>
          <p className="text-muted-foreground">View and manage all public notices and announcements.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Plus className="mr-2 h-4 w-4" /> Add Notice
        </Button>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Pinned</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No notices found.
                </TableCell>
              </TableRow>
            ) : (
              notices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{notice.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{notice.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {notice.is_pinned ? (
                      <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Pinned</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/admin/notices?page=${page - 1}`)}
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
              onClick={() => router.push(`/dashboard/admin/notices?page=${page + 1}`)}
              disabled={page >= totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" required placeholder="Notice title..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select name="category" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Event">Event</option>
                <option value="Hostel">Hostel</option>
                <option value="Exam">Exam</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_pinned" value="true" className="rounded border-input" />
                <span className="text-sm font-medium">Pin this notice</span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachment URL (Optional)</label>
              <Input name="attachment_url" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea name="content" required rows={5} placeholder="Notice content..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Publish</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingNotice} onOpenChange={(open) => !open && setEditingNotice(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Notice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" defaultValue={editingNotice?.title} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select name="category" defaultValue={editingNotice?.category} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="General">General</option>
                <option value="Academic">Academic</option>
                <option value="Event">Event</option>
                <option value="Hostel">Hostel</option>
                <option value="Exam">Exam</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_pinned" value="true" defaultChecked={editingNotice?.is_pinned} className="rounded border-input" />
                <span className="text-sm font-medium">Pin this notice</span>
              </label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Attachment URL (Optional)</label>
              <Input name="attachment_url" defaultValue={editingNotice?.attachment_url || ''} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea name="content" defaultValue={editingNotice?.content} required rows={5} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingNotice(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingNotice} onOpenChange={(open) => !open && setDeletingNotice(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Notice</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to delete the notice <strong>{deletingNotice?.title}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingNotice(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
