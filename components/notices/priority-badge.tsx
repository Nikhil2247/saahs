import { cn } from "@/lib/utils"
import type { NoticePriority } from "@/lib/data"

const styles: Record<NoticePriority, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-brand/10 text-brand",
  low: "bg-secondary text-muted-foreground",
}

const labels: Record<NoticePriority, string> = {
  high: "High Priority",
  medium: "Important",
  low: "General",
}

export function PriorityBadge({ priority }: { priority: NoticePriority }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[11px] font-semibold",
        styles[priority],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {labels[priority]}
    </span>
  )
}
