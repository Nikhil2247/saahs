"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Camera,
  CalendarDays,
  MapPin,
  Search,
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { initialGalleryEvents, GalleryEvent } from "@/lib/gallery-data"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const CATEGORIES = ["All", "Academic", "Cultural", "Sports", "Welfare", "Conventions"]

export default function PublicGalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<GalleryEvent | null>(null)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)

  const filteredEvents = useMemo(() => {
    return initialGalleryEvents.filter((item) => {
      const matchesCat =
        selectedCategory === "All" || item.category === selectedCategory
      const matchesQuery =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCat && matchesQuery
    })
  }, [selectedCategory, searchQuery])

  const openLightbox = (event: GalleryEvent, index = 0) => {
    setSelectedEvent(event)
    setActivePhotoIdx(index)
  }

  const closeLightbox = () => {
    setSelectedEvent(null)
    setActivePhotoIdx(0)
  }

  const nextPhoto = () => {
    if (!selectedEvent) return
    setActivePhotoIdx((prev) => (prev + 1) % selectedEvent.images.length)
  }

  const prevPhoto = () => {
    if (!selectedEvent) return
    setActivePhotoIdx(
      (prev) => (prev - 1 + selectedEvent.images.length) % selectedEvent.images.length
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Event Archive"
        title="Event Gallery"
        description="Browse photo archives from scientific symposiums, sports leagues, cultural fests, and conventions organized by SAAHS at PGIMER Chandigarh."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        {/* Search & Category Filter Toolbar */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative max-w-sm w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event gallery by title or venue…"
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-brand text-brand-foreground shadow-xs"
                    : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Event Cards Grid */}
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            <Camera className="mx-auto mb-3 size-10 text-brand/40" />
            <h3 className="font-bold text-foreground text-sm">No Event Galleries Uploaded Yet</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              Governing body members can create event albums and upload photos directly from the dashboard manager.
            </p>
            <div className="mt-5">
              <Button
                asChild
                className="bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-xs gap-1.5"
              >
                <Link href="/dashboard/admin/gallery">
                  <Plus className="size-3.5" />
                  Upload Event Gallery in Dashboard
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredEvents.map((item) => (
              <div
                key={item.id}
                onClick={() => openLightbox(item, 0)}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:border-brand/40 hover:shadow-md"
              >
                {/* Cover Image */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />

                  {/* Photo count badge */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md border border-border bg-card/90 px-2 py-0.5 text-[10px] font-bold text-foreground backdrop-blur-sm">
                    <ImageIcon className="size-3 text-brand" />
                    <span>{item.images.length}</span>
                  </div>

                  {/* Category badge */}
                  <div className="absolute bottom-2.5 left-2.5 rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 text-[9px] font-bold text-brand backdrop-blur-sm">
                    {item.category}
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mb-1">
                    <CalendarDays className="size-3 text-brand shrink-0" />
                    <span>{new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>

                  <h3 className="text-xs font-bold text-foreground group-hover:text-brand transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="size-3 text-brand shrink-0" />
                      {item.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Viewer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">{selectedEvent.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{selectedEvent.location}</span> · 
                  <span>{new Date(selectedEvent.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                </p>
              </div>
              <button
                onClick={closeLightbox}
                className="flex size-8 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted/80"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Main Image Stage */}
            <div className="relative flex aspect-16/9 w-full items-center justify-center bg-black/95">
              <Image
                src={selectedEvent.images[activePhotoIdx]}
                alt={`${selectedEvent.title} photo ${activePhotoIdx + 1}`}
                fill
                className="object-contain"
                priority
              />

              {/* Prev/Next buttons */}
              {selectedEvent.images.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-3 flex size-9 items-center justify-center rounded-full bg-card/80 text-foreground backdrop-blur-sm transition-colors hover:bg-card"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-3 flex size-9 items-center justify-center rounded-full bg-card/80 text-foreground backdrop-blur-sm transition-colors hover:bg-card"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails bar */}
            <div className="flex items-center justify-between border-t border-border bg-card px-5 py-3">
              <div className="flex gap-2 overflow-x-auto">
                {selectedEvent.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative size-11 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      idx === activePhotoIdx ? "border-brand ring-2 ring-brand/30" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={imgUrl} alt="Thumbnail" fill className="object-cover" />
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-mono font-medium text-muted-foreground shrink-0 pl-3">
                Photo {activePhotoIdx + 1} of {selectedEvent.images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
