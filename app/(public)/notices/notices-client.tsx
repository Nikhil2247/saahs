"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Filter } from "lucide-react"
import { formatDate } from "@/lib/data"

export type NoticeDB = {
  id: string
  title: string
  content: string
  category: string
  is_pinned: boolean
  created_at: string
}

export function NoticesClient({ notices }: { notices: NoticeDB[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const pinnedNotices = notices.filter((n) => n.is_pinned)
  const unpinnedNotices = notices.filter((n) => !n.is_pinned)

  const filterNotices = (noticeList: NoticeDB[]) => {
    return noticeList.filter((notice) => {
      const matchCategory = !selectedCategory || notice.category === selectedCategory
      return matchCategory
    })
  }

  const filteredPinned = filterNotices(pinnedNotices)
  const filteredUnpinned = filterNotices(unpinnedNotices)

  const categories = Array.from(new Set(notices.map((n) => n.category)))

  const NoticeCard = ({ notice }: { notice: NoticeDB }) => (
    <div className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{notice.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{new Date(notice.created_at).toLocaleDateString()}</p>
        </div>
        {notice.is_pinned && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
            <AlertCircle className="size-3.5" />
            Pinned
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge variant="outline">{notice.category}</Badge>
      </div>

      <p className="mb-4 text-sm text-foreground/80 leading-relaxed">{notice.content}</p>

      <Button variant="outline" size="sm">
        Read More
      </Button>
    </div>
  )

  return (
    <>
      {/* Filters */}
      <div className="mb-8 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Filter Notices</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Badge>
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-8">
        {filteredPinned.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-500" />
              Pinned Notices
            </h2>
            <div className="grid gap-4">
              {filteredPinned.map((notice) => (
                <NoticeCard key={notice.id} notice={notice} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">Recent Notices</h2>
          <div className="grid gap-4">
            {filteredUnpinned.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
            {filteredUnpinned.length === 0 && (
              <div className="rounded-lg border border-dashed border-border p-8 text-center">
                <p className="text-muted-foreground">No notices found matching your filters.</p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSelectedCategory(null)
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
