"use client"

import { useState } from "react"
import { updateMemberRole, deleteMember } from "@/app/actions/admin/memberships"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, ShieldAlert, Trash, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export type ProfileDB = {
  id: string
  full_name: string
  email: string
  role: string
  department: string | null
  course: string | null
  avatar_url: string | null
  created_at: string
}

export function MembershipsClient({ 
  profiles, 
  page, 
  totalPages 
}: { 
  profiles: ProfileDB[]
  page: number
  totalPages: number 
}) {
  const router = useRouter()
  const [editingRole, setEditingRole] = useState<ProfileDB | null>(null)
  const [deletingMember, setDeletingMember] = useState<ProfileDB | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingRole) return
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await updateMemberRole(editingRole.id, formData)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Role updated successfully")
      setEditingRole(null)
    } else {
      toast.error(result.error || "Failed to update role")
    }
  }

  const handleDelete = async () => {
    if (!deletingMember) return
    setIsSubmitting(true)
    const result = await deleteMember(deletingMember.id)
    setIsSubmitting(false)
    
    if (result.success) {
      toast.success("Member removed successfully")
      setDeletingMember(null)
    } else {
      toast.error(result.error || "Failed to remove member")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Memberships</h2>
          <p className="text-muted-foreground">View all registered SAAHS members, their departments, and roles.</p>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No members found.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="flex items-center gap-3 font-medium">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
                      <AvatarFallback>{profile.full_name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="max-w-[150px] truncate">{profile.full_name}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[150px]">{profile.email}</TableCell>
                  <TableCell className="truncate max-w-[150px]">{profile.department}</TableCell>
                  <TableCell>
                    <Badge variant={profile.role === 'Admin' ? 'default' : 'secondary'} className={profile.role === 'Admin' ? 'bg-brand' : ''}>
                      {profile.role}
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
                          <DropdownMenuItem onClick={() => setEditingRole(profile)}>
                            <ShieldAlert className="mr-2 h-4 w-4" /> Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeletingMember(profile)} className="text-destructive focus:text-destructive">
                            <Trash className="mr-2 h-4 w-4" /> Remove Member
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
              onClick={() => router.push(`/dashboard/admin/memberships?page=${page - 1}`)}
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
              onClick={() => router.push(`/dashboard/admin/memberships?page=${page + 1}`)}
              disabled={page >= totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Member Role</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-muted-foreground">
            Updating role for <strong>{editingRole?.full_name}</strong>.
          </div>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select name="role" defaultValue={editingRole?.role} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="Student">Student</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRole(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Update Role</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remove Member</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to remove <strong>{deletingMember?.full_name}</strong> from the portal? This will permanently delete their profile data.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingMember(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
