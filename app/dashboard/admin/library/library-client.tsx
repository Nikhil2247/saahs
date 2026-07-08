"use client"

import { useState } from "react"
import { createResource, updateResource, deleteResource } from "@/app/actions/admin/library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { MoreHorizontal, Plus, Pencil, Trash, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type LibraryDB = {
  id: string
  title: string
  resource_type: string
  department: string | null
  subject: string | null
  file_url: string
  created_at: string
}

export function LibraryClient({ 
  resources, 
  page, 
  totalPages 
}: { 
  resources: LibraryDB[]
  page: number
  totalPages: number 
}) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<LibraryDB | null>(null)
  const [deletingResource, setDeletingResource] = useState<LibraryDB | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await createResource(formData)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Resource added successfully")
      setIsCreateOpen(false)
    } else {
      toast.error(result.error || "Failed to add resource")
    }
  }

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingResource) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateResource(editingResource.id, formData)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Resource updated successfully")
      setEditingResource(null)
    } else {
      toast.error(result.error || "Failed to update resource")
    }
  }

  const handleDelete = async () => {
    if (!deletingResource) return
    setIsSubmitting(true)
    const result = await deleteResource(deletingResource.id)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Resource deleted successfully")
      setDeletingResource(null)
    } else {
      toast.error(result.error || "Failed to delete resource")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Library Resources</h2>
          <p className="text-muted-foreground">Manage e-books, past papers, and study materials.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Plus className="mr-2 h-4 w-4" /> Add Resource
        </Button>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No resources found in the library.
                </TableCell>
              </TableRow>
            ) : (
              resources.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.resource_type}</Badge>
                  </TableCell>
                  <TableCell>{r.department || "-"}</TableCell>
                  <TableCell>{r.subject || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem asChild>
                            <a href={r.file_url} target="_blank" rel="noreferrer">
                              <Download className="mr-2 h-4 w-4" /> Download / View
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingResource(r)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingResource(r)} className="text-destructive focus:text-destructive">
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
              onClick={() => router.push(`/dashboard/admin/library?page=${page - 1}`)}
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
              onClick={() => router.push(`/dashboard/admin/library?page=${page + 1}`)}
              disabled={page >= totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Library Resource</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" required placeholder="Resource title..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select name="resource_type" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="E-Book">E-Book</option>
                <option value="Past Paper">Past Paper</option>
                <option value="Notes">Notes</option>
                <option value="Presentation">Presentation</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department (Optional)</label>
              <Input name="department" placeholder="e.g. Radiography" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject (Optional)</label>
              <Input name="subject" placeholder="e.g. Anatomy" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <Input type="file" name="file" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Add Resource</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
 
      {/* Edit Dialog */}
      <Dialog open={!!editingResource} onOpenChange={(open) => !open && setEditingResource(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" defaultValue={editingResource?.title} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select name="resource_type" defaultValue={editingResource?.resource_type} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="E-Book">E-Book</option>
                <option value="Past Paper">Past Paper</option>
                <option value="Notes">Notes</option>
                <option value="Presentation">Presentation</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department (Optional)</label>
              <Input name="department" defaultValue={editingResource?.department || ''} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject (Optional)</label>
              <Input name="subject" defaultValue={editingResource?.subject || ''} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Current File URL</label>
              <Input name="file_url" defaultValue={editingResource?.file_url} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Replace File (Optional)</label>
              <Input type="file" name="file" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingResource(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingResource} onOpenChange={(open) => !open && setDeletingResource(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Resource</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deletingResource?.title}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingResource(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
