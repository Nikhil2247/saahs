"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Bell, FileText, BookOpen, Eye, X } from "lucide-react"
import type { NoticeSection } from "@/types/database"

export type NoticeDB = {
  id: string
  title: string
  content: string
  category: string
  section: NoticeSection
  is_pinned: boolean
  image_url: string | null
  document_type: string | null
  created_at: string
}

type ActiveTab = "General" | "Letters & Minutes" | "Documents"

const TABS: { key: ActiveTab; label: string; icon: React.ElementType }[] = [
  { key: "General",           label: "Notices",            icon: Bell     },
  { key: "Letters & Minutes", label: "Letters & Minutes",  icon: FileText },
  { key: "Documents",         label: "Documents",          icon: BookOpen },
]

export function NoticesClient({ notices }: { notices: NoticeDB[] }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("General")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const tabNotices = notices.filter((n) => n.section === activeTab)
  const pinnedNotices = tabNotices.filter((n) => n.is_pinned)
  const unpinnedNotices = tabNotices.filter((n) => !n.is_pinned)

  const filterNotices = (list: NoticeDB[]) =>
    list.filter((n) => !selectedCategory || n.category === selectedCategory)

  const filteredPinned = filterNotices(pinnedNotices)
  const filteredUnpinned = filterNotices(unpinnedNotices)
  const categories = Array.from(new Set(tabNotices.map((n) => n.category)))

  // ── General Notice Card ────────────────────────────────────────────────────
  const GeneralNoticeCard = ({ notice }: { notice: NoticeDB }) => (
    <div className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{notice.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{new Date(notice.created_at).toLocaleDateString()}</p>
        </div>
        {notice.is_pinned && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
            <AlertCircle className="size-3.5" /> Pinned
          </div>
        )}
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant="outline">{notice.category}</Badge>
      </div>
      <p className="mb-4 text-sm text-foreground/80 leading-relaxed">{notice.content}</p>
      <Button variant="outline" size="sm">Read More</Button>
    </div>
  )

  // ── Letter/Minutes Card ────────────────────────────────────────────────────
  const LetterCard = ({ notice }: { notice: NoticeDB }) => (
    <div className="rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-md">
      {notice.image_url && (
        <div
          className="relative h-48 cursor-pointer overflow-hidden bg-muted"
          onClick={() => setPreviewImage(notice.image_url)}
        >
          <img src={notice.image_url} alt={notice.title} className="h-full w-full object-cover transition-transform hover:scale-105" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
            <Eye className="size-8 text-white" />
          </div>
        </div>
      )}
      <div className="p-5">
        <p className="text-xs text-muted-foreground mb-1">{new Date(notice.created_at).toLocaleDateString()}</p>
        <h3 className="font-semibold text-foreground">{notice.title}</h3>
        {notice.content && <p className="mt-2 text-sm text-muted-foreground">{notice.content}</p>}
        {notice.image_url && (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setPreviewImage(notice.image_url)}>
            <Eye className="size-3.5 mr-1.5" /> View Document
          </Button>
        )}
      </div>
    </div>
  )

  // ── Document Card ──────────────────────────────────────────────────────────
  const DocumentCard = ({ notice }: { notice: NoticeDB }) => (
    <div className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <BookOpen className="size-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {notice.document_type && (
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-600 text-xs">
                {notice.document_type}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{new Date(notice.created_at).toLocaleDateString()}</span>
          </div>
          <h3 className="font-semibold text-foreground">{notice.title}</h3>
          {notice.content && <p className="mt-1.5 text-sm text-muted-foreground">{notice.content}</p>}
          {notice.image_url && (
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <a href={notice.image_url} target="_blank" rel="noreferrer">
                <Eye className="size-3.5 mr-1.5" /> View / Download
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl border border-border bg-muted/30 p-1 mb-8">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setSelectedCategory(null); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* General: category filters */}
      {activeTab === "General" && categories.length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >All</Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >{cat}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="space-y-8">
        {/* General Notices */}
        {activeTab === "General" && (
          <>
            {filteredPinned.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-bold text-foreground flex items-center gap-2">
                  <AlertCircle className="size-5 text-amber-500" /> Pinned Notices
                </h2>
                <div className="grid gap-4">
                  {filteredPinned.map((n) => <GeneralNoticeCard key={n.id} notice={n} />)}
                </div>
              </div>
            )}
            <div>
              <h2 className="mb-4 text-xl font-bold text-foreground">Recent Notices</h2>
              <div className="grid gap-4">
                {filteredUnpinned.map((n) => <GeneralNoticeCard key={n.id} notice={n} />)}
                {filteredUnpinned.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <p className="text-muted-foreground">No notices found.</p>
                    {selectedCategory && (
                      <Button variant="link" onClick={() => setSelectedCategory(null)} className="mt-2">Clear filters</Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Letters & Minutes */}
        {activeTab === "Letters & Minutes" && (
          <div>
            <p className="mb-6 text-sm text-muted-foreground">
              Official letters, meeting notices, and minutes of meetings. Click any image to view it full size.
            </p>
            {tabNotices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <FileText className="size-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No letters or minutes published yet.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tabNotices.map((n) => <LetterCard key={n.id} notice={n} />)}
              </div>
            )}
          </div>
        )}

        {/* Documents */}
        {activeTab === "Documents" && (
          <div>
            <p className="mb-6 text-sm text-muted-foreground">
              Founding documents, constitution, rules &amp; regulations, and official amendments.
            </p>
            {tabNotices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-12 text-center">
                <BookOpen className="size-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No documents published yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tabNotices.map((n) => <DocumentCard key={n.id} notice={n} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300 flex items-center gap-2">
              <X className="size-6" /> Close
            </button>
            <img src={previewImage} alt="Preview" className="rounded-xl w-full object-contain shadow-2xl max-h-[80vh]" />
          </div>
        </div>
      )}
    </>
  )
}
