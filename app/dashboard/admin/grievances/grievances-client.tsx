"use client"

import { useState } from "react"
import { updateGrievanceStatus, deleteGrievance } from "@/app/actions/grievances"
import { Button } from "@/components/ui/button"
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
import { MoreHorizontal, Pencil, Trash, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type GrievanceDB = {
  id: string
  ticket_number: string
  title: string
  description: string
  category: string
  is_anonymous: boolean
  status: string
  created_at: string
}

export function GrievancesClient({ 
  grievances, 
  page, 
  totalPages 
}: { 
  grievances: GrievanceDB[]
  page: number
  totalPages: number 
}) {
  const router = useRouter()
  const [viewingGrievance, setViewingGrievance] = useState<GrievanceDB | null>(null)
  const [editingGrievance, setEditingGrievance] = useState<GrievanceDB | null>(null)
  const [deletingGrievance, setDeletingGrievance] = useState<GrievanceDB | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingGrievance) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateGrievanceStatus(editingGrievance.id, formData)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Grievance status updated successfully")
      setEditingGrievance(null)
    } else {
      toast.error(result.error || "Failed to update grievance")
    }
  }

  const handleDelete = async () => {
    if (!deletingGrievance) return
    setIsSubmitting(true)
    const result = await deleteGrievance(deletingGrievance.id)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Grievance deleted successfully")
      setDeletingGrievance(null)
    } else {
      toast.error(result.error || "Failed to delete grievance")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved": return "bg-green-100 text-green-800"
      case "In Review": return "bg-blue-100 text-blue-800"
      case "Open": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Help Desk & Grievances</h2>
        <p className="text-muted-foreground">View and manage student grievances and help desk tickets.</p>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grievances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No grievances found.
                </TableCell>
              </TableRow>
            ) : (
              grievances.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-xs">{g.ticket_number}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">
                    {new Date(g.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="truncate max-w-[200px]">{g.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{g.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(g.status)} variant="secondary">
                      {g.status}
                    </Badge>
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
                          <DropdownMenuItem onClick={() => setViewingGrievance(g)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingGrievance(g)}>
                            <Pencil className="mr-2 h-4 w-4" /> Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingGrievance(g)} className="text-destructive focus:text-destructive">
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
              onClick={() => router.push(`/dashboard/admin/grievances?page=${page - 1}`)}
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
              onClick={() => router.push(`/dashboard/admin/grievances?page=${page + 1}`)}
              disabled={page >= totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewingGrievance} onOpenChange={(open) => !open && setViewingGrievance(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Grievance Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Ticket</p>
                <p className="font-mono text-sm">{viewingGrievance?.ticket_number}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
                <Badge className={getStatusColor(viewingGrievance?.status || "")} variant="secondary">
                  {viewingGrievance?.status}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Title</p>
              <p className="text-sm font-medium">{viewingGrievance?.title}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Description</p>
              <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-3">{viewingGrievance?.description}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={!!editingGrievance} onOpenChange={(open) => !open && setEditingGrievance(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Grievance Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select name="status" defaultValue={editingGrievance?.status} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="Open">Open</option>
                <option value="In Review">In Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingGrievance(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Update Status</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingGrievance} onOpenChange={(open) => !open && setDeletingGrievance(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Grievance</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to delete ticket <strong>{deletingGrievance?.ticket_number}</strong>? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingGrievance(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
