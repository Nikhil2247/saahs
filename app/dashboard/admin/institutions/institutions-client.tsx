"use client"

import { useState, useTransition } from "react"
import {
  createInstitution,
  updateInstitution,
  deleteInstitution,
} from "@/app/actions/admin/institutions"
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
import { Badge } from "@/components/ui/badge"
import { Plus, Trash, Building2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { InstitutionRow } from "@/types/database"

export function InstitutionsClient({ institutions }: { institutions: InstitutionRow[] }) {
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deleting, setDeleting] = useState<InstitutionRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const result = await createInstitution(name)
    setIsSubmitting(false)

    if (result.success) {
      toast.success("Institution added")
      setIsCreateOpen(false)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to add institution")
    }
  }

  const handleToggleActive = (institution: InstitutionRow) => {
    startTransition(async () => {
      const result = await updateInstitution(institution.id, { is_active: !institution.is_active })
      if (result.success) {
        toast.success(institution.is_active ? "Institution deactivated" : "Institution activated")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update institution")
      }
    })
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsSubmitting(true)
    const result = await deleteInstitution(deleting.id)
    setIsSubmitting(false)

    if (result.success) {
      toast.success("Institution deleted")
      setDeleting(null)
      router.refresh()
    } else {
      toast.error(result.error || "Failed to delete institution")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="size-6" /> Institutions
          </h2>
          <p className="text-muted-foreground">
            Manage the institutions offered on the onboarding form.
          </p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="h-8 text-xs font-medium">
          <Plus className="mr-1.5 size-3.5" /> Add Institution
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {institutions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                  No institutions yet.
                </TableCell>
              </TableRow>
            ) : (
              institutions.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell className="font-medium">{institution.name}</TableCell>
                  <TableCell>
                    <Badge variant={institution.is_active ? "default" : "secondary"}>
                      {institution.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(institution)}>
                      {institution.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleting(institution)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Institution</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input name="name" required placeholder="e.g. PGIMER" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Institution</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleting?.name}</strong>? Students who already
            selected it will keep their existing value.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
