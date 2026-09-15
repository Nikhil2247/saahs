"use client"

import { useState } from "react"
import { getResourcesByFolder } from "@/app/actions/admin/library"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  BookOpen,
  FolderOpen,
  Layers,
  GraduationCap,
  Eye,
  Search,
  ChevronRight,
  FileText,
  ArrowLeft,
} from "lucide-react"

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

export function LibraryBrowser({ initialFolders }: { initialFolders: Folder[] }) {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)
  const [openFolder, setOpenFolder] = useState<Folder | null>(null)
  const [folderResources, setFolderResources] = useState<Resource[]>([])
  const [loadingResources, setLoadingResources] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const folders = initialFolders

  const openFolderView = async (folder: Folder) => {
    setOpenFolder(folder)
    setLoadingResources(true)
    const { data } = await getResourcesByFolder(folder.id)
    setFolderResources((data as Resource[]) || [])
    setLoadingResources(false)
  }

  const reset = () => { setSelectedCourse(null); setSelectedSemester(null); setOpenFolder(null); setFolderResources([]); setSearchQuery("") }

  const uniqueCourses = Array.from(new Set(folders.map((f) => f.course)))
  const semestersForCourse = selectedCourse
    ? Array.from(new Set(folders.filter((f) => f.course === selectedCourse).map((f) => f.semester)))
    : []
  const foldersForSelection = folders.filter(
    (f) => f.course === selectedCourse && f.semester === selectedSemester
  )
  const filteredResources = folderResources.filter(
    (r) => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── Header ──────────────────────────────────────────────────────────────────
  const Header = (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <BookOpen className="size-4" />
      </div>
      <div>
        <h2 className="text-base font-bold tracking-tight text-foreground">E-Library &amp; Study Material</h2>
        <p className="text-[11px] text-muted-foreground">Navigate by discipline and semester to access resources.</p>
      </div>
    </div>
  )

  // ── Breadcrumb ───────────────────────────────────────────────────────────────
  const Breadcrumb = (selectedCourse || openFolder) && (
    <nav className="flex items-center gap-1 text-xs flex-wrap bg-muted/40 border border-border px-3 py-2 rounded-lg mb-4">
      <button onClick={reset} className="text-primary hover:underline font-semibold whitespace-nowrap">
        All Disciplines
      </button>
      {selectedCourse && (
        <>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <button
            onClick={() => { setSelectedSemester(null); setOpenFolder(null); setFolderResources([]); }}
            className="text-primary hover:underline font-medium truncate max-w-[180px]"
          >
            {selectedCourse}
          </button>
        </>
      )}
      {selectedSemester && (
        <>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          {openFolder ? (
            <button
              onClick={() => { setOpenFolder(null); setFolderResources([]); setSearchQuery(""); }}
              className="text-primary hover:underline font-medium whitespace-nowrap"
            >
              {selectedSemester}
            </button>
          ) : (
            <span className="text-muted-foreground whitespace-nowrap">{selectedSemester}</span>
          )}
        </>
      )}
      {openFolder && (
        <>
          <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground truncate max-w-[140px]">{openFolder.name}</span>
        </>
      )}
    </nav>
  )

  // ── LEVEL 0: Courses ─────────────────────────────────────────────────────────
  if (!selectedCourse) {
    return (
      <div>
        {Header}
        {uniqueCourses.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            <BookOpen className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            No study resources have been published yet. Check back soon.
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">Select your discipline to browse resources:</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {uniqueCourses.map((course) => {
                const count = folders.filter((f) => f.course === course).length
                return (
                  <button
                    key={course}
                    onClick={() => setSelectedCourse(course)}
                    className="group text-left rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <GraduationCap className="size-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {count} {count === 1 ? "folder" : "folders"}
                      </Badge>
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 mb-2">
                      {course}
                    </p>
                    <div className="flex items-center text-[11px] text-primary font-medium">
                      <span>Browse Semesters</span>
                      <ChevronRight className="ml-1 size-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── LEVEL 1: Semesters ───────────────────────────────────────────────────────
  if (selectedCourse && !selectedSemester && !openFolder) {
    return (
      <div>
        {Header}
        {Breadcrumb}
        <p className="text-xs text-muted-foreground mb-3">
          Select a semester for <strong className="text-foreground">{selectedCourse}</strong>:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {semestersForCourse.map((sem) => {
            const fc = folders.filter((f) => f.course === selectedCourse && f.semester === sem).length
            return (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className="group text-left rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <Layers className="size-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-semibold text-foreground">{sem}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {fc} {fc === 1 ? "folder" : "folders"}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── LEVEL 2: Folders ─────────────────────────────────────────────────────────
  if (selectedCourse && selectedSemester && !openFolder) {
    return (
      <div>
        {Header}
        {Breadcrumb}
        {foldersForSelection.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <FolderOpen className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            No folders available for this semester yet.
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Subject folders in <strong className="text-foreground">{selectedSemester}</strong>:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {foldersForSelection.map((f) => (
                <button
                  key={f.id}
                  onClick={() => openFolderView(f)}
                  className="group text-left rounded-xl border border-border bg-card p-4 transition-all hover:border-amber-400/60 hover:shadow-md flex items-center gap-3"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20 transition-colors">
                    <FolderOpen className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-foreground truncate">{f.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Added {new Date(f.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── LEVEL 3: Documents ───────────────────────────────────────────────────────
  if (openFolder) {
    return (
      <div>
        {Header}
        {Breadcrumb}

        {/* Folder header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
              <FolderOpen className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{openFolder.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{openFolder.course} · {openFolder.semester}</p>
            </div>
          </div>
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search files…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>

        {loadingResources ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <div className="size-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Loading resources…
            </div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-10 text-center">
            <FileText className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No files match your search." : "No files in this folder yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/30 hover:bg-muted/20 transition-all"
              >
                {/* File icon */}
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" />
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{res.title}</p>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                      {res.category}
                    </Badge>
                    {res.file_size_bytes && (
                      <span className="text-[11px] text-muted-foreground">
                        {(res.file_size_bytes / 1024 / 1024).toFixed(1)} MB
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(res.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* View button — no download */}
                <a
                  href={res.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary hover:text-primary-foreground px-3 py-1.5 text-xs font-medium text-primary transition-all"
                >
                  <Eye className="size-3" />
                  View
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return null
}
