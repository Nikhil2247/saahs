"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Camera,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  ImageIcon,
  X,
  Sparkles,
} from "lucide-react"
import { initialGalleryEvents, GalleryEvent } from "@/lib/gallery-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function GalleryManagerPage() {
  const [events, setEvents] = useState<GalleryEvent[]>(initialGalleryEvents)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form State
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [category, setCategory] = useState<GalleryEvent["category"]>("Academic")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [photosInput, setPhotosInput] = useState("")

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !location.trim()) {
      toast.error("Please fill in event title and location.")
      return
    }

    const imageList = photosInput
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0)

    const finalCover = coverImage.trim() || imageList[0] || "/about-hero.png"
    const finalImages = imageList.length > 0 ? imageList : [finalCover]

    const newEvent: GalleryEvent = {
      id: `gal-${Date.now()}`,
      title: title.trim(),
      date,
      category,
      location: location.trim(),
      description: description.trim() || "Executed event gallery.",
      coverImage: finalCover,
      images: finalImages,
      createdAt: new Date().toISOString(),
    }

    setEvents((prev) => [newEvent, ...prev])
    toast.success(`Event gallery "${title}" created successfully!`)

    // Reset Form
    setTitle("")
    setLocation("")
    setDescription("")
    setCoverImage("")
    setPhotosInput("")
    setShowCreateModal(false)
  }

  const handleDeleteEvent = (id: string, eventTitle: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    toast.success(`Deleted event gallery "${eventTitle}"`)
  }

  return (
    <div className="dashboard-container space-y-6 py-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-brand/10 text-brand border-brand/30 font-semibold text-xs">
              Governing Body Console
            </Badge>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Event Gallery Manager
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create event albums and upload executed event photos for SAAHS.
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-brand hover:bg-brand/90 text-brand-foreground font-semibold gap-2 text-xs h-9 px-4"
        >
          <Plus className="size-4" />
          Create Event Gallery
        </Button>
      </div>

      {/* Empty State when demo data deleted */}
      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          <Camera className="mx-auto mb-3 size-10 text-brand/40" />
          <h3 className="font-bold text-foreground text-sm">No Event Galleries Uploaded Yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            Click &quot;Create Event Gallery&quot; above to upload your first event album and photos!
          </p>
          <div className="mt-5">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-xs gap-1.5"
            >
              <Plus className="size-3.5" />
              Create First Event Gallery
            </Button>
          </div>
        </div>
      ) : (
        /* Smaller Compact Events Grid */
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden border border-border shadow-xs hover:border-brand/40 transition-all">
              <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                <Image
                  src={event.coverImage}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 rounded-md border border-border bg-card/90 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur-sm">
                  {event.images.length} Photos
                </div>
                <div className="absolute bottom-2 left-2 rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 text-[9px] font-bold text-brand backdrop-blur-sm">
                  {event.category}
                </div>
              </div>

              <CardContent className="p-3.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3 text-brand" />
                    {event.date}
                  </span>
                </div>

                <h3 className="font-bold text-foreground text-xs line-clamp-1">{event.title}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

                <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate max-w-[130px]">
                    <MapPin className="size-3 text-brand shrink-0" />
                    {event.location}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id, event.title)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 w-7 p-0"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Event Gallery Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3.5 mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Create Event Gallery</h3>
                <p className="text-xs text-muted-foreground">Add executed event photos to the public gallery.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Event Title</label>
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
                  <label className="text-xs font-semibold text-foreground mb-1 block">Event Date</label>
                  <Input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Category</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-ring h-9"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                  >
                    <option value="Academic">Academic</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Welfare">Welfare</option>
                    <option value="Conventions">Conventions</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Location / Venue</label>
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

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Cover Image URL</label>
                <Input
                  placeholder="/about-hero.png or image URL"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Event Photo URLs (One URL per line)
                </label>
                <Textarea
                  placeholder="/about-hero.png&#10;/about-students.png&#10;/niahs-building.png"
                  value={photosInput}
                  onChange={(e) => setPhotosInput(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-xs h-8">
                  Publish Event Gallery
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
