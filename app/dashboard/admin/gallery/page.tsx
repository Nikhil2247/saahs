"use client"

import { useState, useRef, useTransition, useEffect } from "react"
import Image from "next/image"
import {
  Camera, Plus, Trash2, Calendar, MapPin, X, Pencil,
  Upload, ImageIcon, Loader2, CheckCircle2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  getGalleryEvents,
  createGalleryEvent,
  updateGalleryEvent,
  deleteGalleryEvent,
  type GalleryEventRow,
  type GalleryCategory,
} from "@/app/actions/admin/gallery"

const CATEGORIES: GalleryCategory[] = ["Academic", "Cultural", "Sports", "Welfare", "Conventions"]

// ── Image Dropzone ─────────────────────────────────────────────────────────────

interface DropzoneProps {
  label: string
  multiple?: boolean
  accept?: string
  files: File[]
  previewUrls: string[]
  onFilesChange: (files: File[], urls: string[]) => void
  existingUrls?: string[]
  hint?: string
}

function ImageDropzone({ label, multiple, files, previewUrls, onFilesChange, existingUrls = [], hint }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return
    const arr = Array.from(newFiles).filter((f) => f.type.startsWith("image/"))
    if (arr.length === 0) return
    const urls = arr.map((f) => URL.createObjectURL(f))
    if (multiple) {
      onFilesChange([...files, ...arr], [...previewUrls, ...urls])
    } else {
      onFilesChange([arr[0]], [urls[0]])
    }
  }

  const removeNew = (i: number) => {
    URL.revokeObjectURL(previewUrls[i])
    onFilesChange(files.filter((_, idx) => idx !== i), previewUrls.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-foreground block">{label}</label>
      {hint && <p className="text-[10px] text-muted-foreground -mt-1">{hint}</p>}

      <div
        className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer ${isDragging ? "border-brand bg-brand/5" : "border-border hover:border-brand/50 hover:bg-muted/30"}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground select-none">
          <Upload className="size-6 text-brand/60" />
          <span className="text-xs font-medium">
            Drop {multiple ? "images" : "image"} here or <span className="text-brand font-semibold">click to upload</span>
          </span>
          <span className="text-[10px]">JPG, PNG, WebP supported</span>
        </div>
      </div>

      {/* Existing URLs (from DB) */}
      {existingUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {existingUrls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-[9px] text-white font-semibold">Existing</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New previews */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-brand/30">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeNew(i) }}
                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-destructive"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Gallery Form Modal ──────────────────────────────────────────────────────────

interface GalleryFormProps {
  editing?: GalleryEventRow | null
  onClose: () => void
  onSaved: () => void
}

function GalleryFormModal({ editing, onClose, onSaved }: GalleryFormProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(editing?.title ?? "")
  const [eventDate, setEventDate] = useState(editing?.event_date ?? new Date().toISOString().split("T")[0])
  const [category, setCategory] = useState<GalleryCategory>(editing?.category ?? "Academic")
  const [location, setLocation] = useState(editing?.location ?? "")
  const [description, setDescription] = useState(editing?.description ?? "")

  const [coverFiles, setCoverFiles] = useState<File[]>([])
  const [coverPreviews, setCoverPreviews] = useState<string[]>([])

  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !location.trim()) {
      toast.error("Title and location are required.")
      return
    }
    if (!editing && coverFiles.length === 0 && photoFiles.length === 0) {
      toast.error("Upload at least a cover image or one photo.")
      return
    }

    const fd = new FormData()
    fd.set("title", title.trim())
    fd.set("event_date", eventDate)
    fd.set("category", category)
    fd.set("location", location.trim())
    fd.set("description", description.trim())

    if (coverFiles[0]) fd.set("cover_image", coverFiles[0])
    photoFiles.forEach((f) => fd.append("photos", f))

    if (editing) {
      fd.set("existing_cover_url", editing.cover_image_url)
      fd.set("existing_photo_urls", JSON.stringify(editing.photo_urls))
    }

    startTransition(async () => {
      const result = editing
        ? await updateGalleryEvent(editing.id, fd)
        : await createGalleryEvent(fd)

      if (result.success) {
        toast.success(editing ? "Gallery updated!" : "Gallery published!")
        onSaved()
      } else {
        toast.error(result.error || "Failed to save gallery.")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              {editing ? "Edit Event Gallery" : "Create Event Gallery"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Add executed event photos to the public gallery.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Event Title *</label>
            <Input
              required
              placeholder="e.g. SAAHS Premier Sports League 2026 Finals"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Event Date *</label>
              <Input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Category</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring h-9"
                value={category}
                onChange={(e) => setCategory(e.target.value as GalleryCategory)}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Location / Venue *</label>
            <Input
              required
              placeholder="e.g. PGIMER Sports Complex, Sector 12"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Description</label>
            <Textarea
              placeholder="Brief summary of the executed event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <ImageDropzone
            label="Cover Image"
            hint="First photo auto-used as cover if none uploaded"
            files={coverFiles}
            previewUrls={coverPreviews}
            onFilesChange={(f, u) => { setCoverFiles(f); setCoverPreviews(u) }}
            existingUrls={editing?.cover_image_url ? [editing.cover_image_url] : []}
          />

          <ImageDropzone
            label="Event Photos"
            multiple
            hint="Select multiple images at once"
            files={photoFiles}
            previewUrls={photoPreviews}
            onFilesChange={(f, u) => { setPhotoFiles(f); setPhotoPreviews(u) }}
            existingUrls={editing?.photo_urls ?? []}
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs h-8" disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-xs h-8 gap-1.5" disabled={isPending}>
              {isPending ? <><Loader2 className="size-3.5 animate-spin" /> Uploading...</> : <><CheckCircle2 className="size-3.5" /> {editing ? "Save Changes" : "Publish Gallery"}</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function GalleryManagerPage() {
  const [events, setEvents] = useState<GalleryEventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<GalleryEventRow | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadEvents = async () => {
    setLoading(true)
    const res = await getGalleryEvents()
    if (res.success && res.data) setEvents(res.data)
    setLoading(false)
  }

  useEffect(() => { loadEvents() }, [])

  const handleDelete = (event: GalleryEventRow) => {
    if (!confirm(`Delete gallery "${event.title}"? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await deleteGalleryEvent(event.id)
      if (res.success) {
        toast.success("Gallery deleted.")
        setEvents((prev) => prev.filter((e) => e.id !== event.id))
      } else {
        toast.error(res.error || "Delete failed.")
      }
    })
  }

  const openCreate = () => { setEditingEvent(null); setShowForm(true) }
  const openEdit = (ev: GalleryEventRow) => { setEditingEvent(ev); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditingEvent(null) }
  const onSaved = () => { closeForm(); loadEvents() }

  return (
    <div className="dashboard-container space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <Badge variant="outline" className="bg-brand/10 text-brand border-brand/30 font-semibold text-xs mb-1">
            Event Gallery
          </Badge>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Gallery Manager
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create event albums and publish executed event photos for SAAHS.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-brand hover:bg-brand/90 text-brand-foreground font-semibold gap-2 text-xs h-9 px-4"
        >
          <Plus className="size-4" /> Create Event Gallery
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-7 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Camera className="mx-auto mb-3 size-10 text-brand/40" />
          <h3 className="font-bold text-foreground text-sm">No Event Galleries Yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            Click "Create Event Gallery" to upload your first event album.
          </p>
          <Button onClick={openCreate} className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-xs gap-1.5">
            <Plus className="size-3.5" /> Create First Gallery
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden border border-border shadow-xs hover:border-brand/40 transition-all group">
              <div className="relative aspect-video w-full overflow-hidden bg-muted">
                {event.cover_image_url ? (
                  <img
                    src={event.cover_image_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="size-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2 rounded-md border border-border bg-card/90 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur-sm">
                  {event.photo_urls.length} Photos
                </div>
                <div className="absolute bottom-2 left-2 rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 text-[9px] font-bold text-brand backdrop-blur-sm">
                  {event.category}
                </div>
              </div>

              <CardContent className="p-3.5">
                <div className="flex items-center text-[10px] text-muted-foreground mb-1 font-medium gap-1">
                  <Calendar className="size-3 text-brand" />
                  {new Date(event.event_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </div>
                <h3 className="font-bold text-foreground text-xs line-clamp-1">{event.title}</h3>
                {event.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{event.description}</p>
                )}
                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between gap-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                    <MapPin className="size-3 text-brand shrink-0" />{event.location}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(event)}
                      className="text-muted-foreground hover:text-foreground h-7 w-7 p-0">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(event)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 p-0" disabled={isPending}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <GalleryFormModal editing={editingEvent} onClose={closeForm} onSaved={onSaved} />
      )}
    </div>
  )
}
