"use client"

import type { ReactNode } from "react"
import { CalendarDays, Tag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export type NoticeDB = {
  id: string
  title: string
  content: string
  category: string
  is_pinned: boolean
  created_at: string
}

export function NoticeDialog({
  notice,
  children,
}: {
  notice: NoticeDB
  children: ReactNode
}) {
  return (
    <Dialog>
      <DialogTrigger render={<button type="button" className="block w-full text-left" />}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Tag className="size-3" />
              {notice.category}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">
              ID: {notice.id}
            </span>
          </div>
          <DialogTitle className="text-lg leading-snug text-balance">
            {notice.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            Published on {new Date(notice.created_at).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {notice.content}
        </p>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
