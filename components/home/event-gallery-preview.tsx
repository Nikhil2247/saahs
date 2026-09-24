"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Camera,
  CalendarDays,
  MapPin,
  ArrowRight,
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"
import { initialGalleryEvents, GalleryEvent } from "@/lib/gallery-data"

export function EventGalleryPreview() {
  const [events] = useState<GalleryEvent[]>(initialGalleryEvents)
  const [selectedEvent, setSelectedEvent] = useState<GalleryEvent | null>(null)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)

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
    <section className="border-t border-border bg-card/20 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Camera className="size-3.5" />
              03. Event Gallery
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Captured Event Moments
            </h2>
            <p className="mt-1 max-w-2xl text-xs md:text-sm text-muted-foreground">
              Photo archives from scientific symposiums, sports leagues, and campus conventions organized by SAAHS at PGIMER.
            </p>
          </div>

          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition-all hover:bg-muted"
          >
            Explore Event Gallery
            <ArrowRight className="size-3.5 text-brand" />
          </Link>
        </div>

        {/* Empty State when no events uploaded */}
        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center backdrop-blur-xs">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20">
              <Camera className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">No Event Galleries Uploaded Yet</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              Governing body members can create event albums and upload photos directly from the dashboard manager.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/dashboard/admin/gallery"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-brand-foreground shadow-xs hover:bg-brand/90"
              >
                <Plus className="size-3.5" />
                Upload Event Album (Dashboard)
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                View Gallery Page
              </Link>
            </div>
          </div>
        ) : (
          /* Smaller, Compact Gallery Grid */
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {events.map((item) => (
              <div
                key={item.id}
                onClick={() => openLightbox(item, 0)}
                className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all hover:border-brand/40 hover:shadow-sm"
              >
                {/* Cover Image Container */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-50 group-hover:opacity-30 transition-opacity" />

                  {/* Photo Count Badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md border border-border bg-card/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
                    <ImageIcon className="size-3 text-brand" />
                    <span>{item.images.length}</span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute bottom-2 left-2 rounded-md border border-brand/30 bg-brand/10 px-2 py-0.5 text-[9px] font-bold text-brand backdrop-blur-sm">
                    {item.category}
                  </div>
                </div>

                {/* Text Info */}
                <div className="p-3">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mb-1">
                    <CalendarDays className="size-3 text-brand shrink-0" />
                    <span>{new Date(item.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>

                  <h3 className="text-xs font-bold text-foreground group-hover:text-brand transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="size-3 shrink-0 text-brand" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">{selectedEvent.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{selectedEvent.location}</span> · 
                  <span className="text-brand font-semibold">{selectedEvent.images.length} Photos</span>
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
            <div className="relative flex aspect-16/9 w-full items-center justify-center bg-black/90">
              <Image
                src={selectedEvent.images[activePhotoIdx]}
                alt={`${selectedEvent.title} photo ${activePhotoIdx + 1}`}
                fill
                className="object-contain"
                priority
              />

              {/* Prev / Next controls */}
              {selectedEvent.images.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 flex size-9 items-center justify-center rounded-full bg-card/80 text-foreground backdrop-blur-sm transition-colors hover:bg-card"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 flex size-9 items-center justify-center rounded-full bg-card/80 text-foreground backdrop-blur-sm transition-colors hover:bg-card"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails strip */}
            <div className="flex items-center justify-between border-t border-border bg-card px-5 py-2.5">
              <div className="flex gap-2 overflow-x-auto">
                {selectedEvent.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative size-10 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      idx === activePhotoIdx ? "border-brand ring-2 ring-brand/30" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image src={imgUrl} alt="Thumbnail" fill className="object-cover" />
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-mono font-medium text-muted-foreground shrink-0 pl-3">
                {activePhotoIdx + 1} / {selectedEvent.images.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
