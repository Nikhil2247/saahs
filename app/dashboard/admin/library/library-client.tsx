"use client"

import { useState, useEffect, useCallback } from "react"
import {
  createFolder, deleteFolder,
  createResource, updateResource, deleteResource,
  getFolders, getResourcesByFolder,
} from "@/app/actions/admin/library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  FolderOpen, FolderPlus, Plus, Trash, Download, ChevronRight,
  ChevronLeft, BookOpen, Layers, GraduationCap, FileText,
} from "lucide-react"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type Folder = {
  id: number
  name: string
  course: string
  semester: string
  created_at: string
}

type Resource = {
  id: number
  title: string
  category: string
  file_url: string
  file_size_bytes: number | null
  mime_type: string | null
  folder_id: number | null
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSES = [
  "Medical Laboratory Science (BMLS)",
  "Medical Radiology & Imaging Technology",
  "Radiotherapy Technology",
  "Operation Theatre Technology",
  "Medical Technology – Perfusionist",
  "Embalming & Mortuary Science",
  "Audiology & Speech-Language Pathology (BASLP)",
  "Medical Technology – Dialysis Therapy",
  "Optometry",
  "Physiotherapy",
  "Health Information Management",
  "Public Health",
  "Medical Animation & Audio-Visual Creation",
  "PGIMER Students (General)",
]

const SEMESTERS = [
  "Semester 1", "Semester 2", "Semester 3", "Semester 4",
  "Semester 5", "Semester 6", "Semester 7", "Semester 8",
  "Annual", "Common Resources",
]

const RESOURCE_TYPES = ["Notes", "Past Paper", "E-Book", "Presentation", "SOP", "Research", "Other"]

// ─── Component ────────────────────────────────────────────────────────────────

export function LibraryClient({
  resources: _initialResources,
  page,
  totalPages,
}: {
  resources: Resource[]
  page: number
  totalPages: number
}) {
  // Folder navigation state
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)
  const [openFolder, setOpenFolder] = useState<Folder | null>(null)
  const [folderResources, setFolderResources] = useState<Resource[]>([])
  const [loadingResources, setLoadingResources] = useState(false)

  // Dialog state
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false)
  const [deletingFolder, setDeletingFolder] = useState<Folder | null>(null)
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load folders
  const loadFolders = useCallback(async () => {
    const { data } = await getFolders()
    setFolders(data as Folder[])
  }, [])

  useEffect(() => { loadFolders() }, [loadFolders])

  // When a folder is opened, load its resources
  const openFolderView = async (folder: Folder) => {
    setOpenFolder(folder)
    setLoadingResources(true)
    const { data } = await getResourcesByFolder(folder.id)
    setFolderResources(data as Resource[])
    setLoadingResources(false)
  }

  // Derived: courses with at least one folder
  const uniqueCourses = Array.from(new Set(folders.map((f) => f.course)))
  const semestersForCourse = selectedCourse
    ? Array.from(new Set(folders.filter((f) => f.course === selectedCourse).map((f) => f.semester)))
    : []
  const foldersForSelection = folders.filter(
    (f) => f.course === selectedCourse && f.semester === selectedSemester
  )

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const result = await createFolder(formData)
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Folder created")
      setIsFolderDialogOpen(false)
      loadFolders()
    } else {
      toast.error(result.error || "Failed to create folder")
    }
  }

  const handleDeleteFolder = async () => {
    if (!deletingFolder) return
    setIsSubmitting(true)
    const result = await deleteFolder(deletingFolder.id)
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Folder deleted")
      setDeletingFolder(null)
      if (openFolder?.id === deletingFolder.id) {
        setOpenFolder(null); setFolderResources([])
      }
      loadFolders()
    } else {
      toast.error(result.error || "Failed to delete folder")
    }
  }

  const handleCreateResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    if (openFolder) {
      formData.set("folder_id", String(openFolder.id))
      formData.set("course", openFolder.course)
      formData.set("semester", openFolder.semester)
    }
    const result = await createResource(formData)
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Resource uploaded")
      setIsResourceDialogOpen(false)
      if (openFolder) {
        const { data } = await getResourcesByFolder(openFolder.id)
        setFolderResources(data as Resource[])
      }
    } else {
      toast.error(result.error || "Failed to upload resource")
    }
  }

  const handleDeleteResource = async () => {
    if (!deletingResource) return
    setIsSubmitting(true)
    const result = await deleteResource(String(deletingResource.id))
    setIsSubmitting(false)
    if (result.success) {
      toast.success("Resource deleted")
      setDeletingResource(null)
      if (openFolder) {
        const { data } = await getResourcesByFolder(openFolder.id)
        setFolderResources(data as Resource[])
      }
    } else {
      toast.error(result.error || "Failed to delete")
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">E-Library</h2>
          <p className="text-muted-foreground">Organise resources by course and semester using folders.</p>
        </div>
        <Button size="sm" onClick={() => setIsFolderDialogOpen(true)} className="h-8 text-xs font-medium">
          <FolderPlus className="mr-1.5 size-3.5" /> New Folder
        </Button>
      </div>

      {/* ── Breadcrumb ── */}
      {(selectedCourse || openFolder) && (
        <div className="flex items-center gap-1.5 text-sm flex-wrap">
          <button
            onClick={() => { setSelectedCourse(null); setSelectedSemester(null); setOpenFolder(null); }}
            className="text-primary hover:underline font-medium"
          >
            All Courses
          </button>
          {selectedCourse && (
            <>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <button
                onClick={() => { setSelectedSemester(null); setOpenFolder(null); }}
                className="text-primary hover:underline"
              >
                {selectedCourse}
              </button>
            </>
          )}
          {selectedSemester && !openFolder && (
            <>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{selectedSemester}</span>
            </>
          )}
          {openFolder && (
            <>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <button
                onClick={() => { setOpenFolder(null); setFolderResources([]); }}
                className="text-primary hover:underline"
              >
                {selectedSemester}
              </button>
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <span className="font-medium text-foreground">{openFolder.name}</span>
            </>
          )}
        </div>
      )}

      {/* ── LEVEL 0: Course grid ── */}
      {!selectedCourse && !openFolder && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            {uniqueCourses.length === 0
              ? "No folders created yet. Create a folder to get started."
              : `${uniqueCourses.length} course${uniqueCourses.length !== 1 ? "s" : ""} with library content.`}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {uniqueCourses.map((course) => {
              const count = folders.filter((f) => f.course === course).length
              return (
                <button
                  key={course}
                  onClick={() => setSelectedCourse(course)}
                  className="group text-left rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <GraduationCap className="size-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">{count} folder{count !== 1 ? "s" : ""}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{course}</p>
                  <ChevronRight className="size-4 text-muted-foreground mt-2 group-hover:text-primary transition-colors" />
                </button>
              )
            })}

            {/* Add new folder placeholder */}
            <button
              onClick={() => setIsFolderDialogOpen(true)}
              className="rounded-xl border-2 border-dashed border-border bg-card/50 p-5 text-center transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <FolderPlus className="size-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Create New Folder</p>
            </button>
          </div>
        </div>
      )}

      {/* ── LEVEL 1: Semester grid for selected course ── */}
      {selectedCourse && !selectedSemester && !openFolder && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            <span className="text-muted-foreground font-normal">Course: </span>{selectedCourse}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {semestersForCourse.map((sem) => {
              const folderCount = folders.filter((f) => f.course === selectedCourse && f.semester === sem).length
              return (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className="group text-left rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <Layers className="size-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-foreground">{sem}</p>
                  <p className="text-xs text-muted-foreground mt-1">{folderCount} folder{folderCount !== 1 ? "s" : ""}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LEVEL 2: Folders for selected course+semester ── */}
      {selectedCourse && selectedSemester && !openFolder && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{selectedSemester} — Folders</h3>
            <Button size="sm" variant="outline" onClick={() => setIsFolderDialogOpen(true)}>
              <FolderPlus className="size-3.5 mr-1.5" /> Add Folder
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {foldersForSelection.length === 0 ? (
              <div className="col-span-full rounded-xl border-2 border-dashed border-border p-10 text-center">
                <FolderOpen className="size-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No folders yet for this semester.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsFolderDialogOpen(true)}>
                  <FolderPlus className="size-3.5 mr-1.5" /> Create Folder
                </Button>
              </div>
            ) : (
              foldersForSelection.map((folder) => (
                <div key={folder.id} className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
                  <button className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeletingFolder(folder)}>
                    <Trash className="size-3.5 text-destructive" />
                  </button>
                  <button className="w-full text-left" onClick={() => openFolderView(folder)}>
                    <FolderOpen className="size-7 text-primary mb-2 group-hover:scale-110 transition-transform" />
                    <p className="font-semibold text-foreground">{folder.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to view contents</p>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── LEVEL 3: Resources inside a folder ── */}
      {openFolder && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{openFolder.name}</h3>
              <p className="text-xs text-muted-foreground">{openFolder.course} · {openFolder.semester}</p>
            </div>
            <Button size="sm" onClick={() => setIsResourceDialogOpen(true)} className="h-8 text-xs font-medium">
              <Plus className="mr-1.5 size-3.5" /> Upload Resource
            </Button>
          </div>

          {loadingResources ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
              Loading…
            </div>
          ) : folderResources.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
              <FileText className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">This folder is empty.</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsResourceDialogOpen(true)}>
                <Plus className="size-3.5 mr-1.5" /> Upload First Resource
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {folderResources.map((r) => (
                <div key={r.id} className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
                  <button
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeletingResource(r)}
                  >
                    <Trash className="size-3.5 text-destructive" />
                  </button>
                  <BookOpen className="size-6 text-primary mb-2" />
                  <p className="font-medium text-foreground text-sm leading-snug line-clamp-2">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.category}</p>
                  {r.file_size_bytes && (
                    <p className="text-xs text-muted-foreground">{(r.file_size_bytes / 1024 / 1024).toFixed(2)} MB</p>
                  )}
                  <a
                    href={r.file_url} target="_blank" rel="noreferrer"
                    className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="size-3" /> Download / View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Create Folder Dialog ────────────────────────────────────────────── */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateFolder} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Folder Name</label>
              <Input name="name" required placeholder="e.g. Unit 1 Notes, Anatomy Lab Manual…" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Course</label>
              <select name="course" defaultValue={selectedCourse || ""} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="">Select course…</option>
                {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Semester</label>
              <select name="semester" defaultValue={selectedSemester || ""} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="">Select semester…</option>
                {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFolderDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Create Folder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Upload Resource Dialog ──────────────────────────────────────────── */}
      <Dialog open={isResourceDialogOpen} onOpenChange={setIsResourceDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Upload Content to "{openFolder?.name}"</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateResource} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Content Name / Title</label>
              <Input name="title" required placeholder="e.g. Chapter 3 — Haematology Notes" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select name="resource_type" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <Input type="file" name="file" required />
              <p className="text-xs text-muted-foreground">PDF, images, PPTX, DOCX, etc.</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsResourceDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Folder Confirm ───────────────────────────────────────────── */}
      <Dialog open={!!deletingFolder} onOpenChange={(open) => !open && setDeletingFolder(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="text-destructive">Delete Folder</DialogTitle></DialogHeader>
          <div className="py-3 text-sm text-muted-foreground">
            Delete <strong>{deletingFolder?.name}</strong>? All resources inside will lose their folder association.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingFolder(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteFolder} disabled={isSubmitting}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Resource Confirm ─────────────────────────────────────────── */}
      <Dialog open={!!deletingResource} onOpenChange={(open) => !open && setDeletingResource(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="text-destructive">Delete Resource</DialogTitle></DialogHeader>
          <div className="py-3 text-sm text-muted-foreground">
            Delete <strong>{deletingResource?.title}</strong>? This cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingResource(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteResource} disabled={isSubmitting}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
