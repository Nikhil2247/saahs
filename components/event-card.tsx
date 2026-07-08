import { CalendarDays, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { formatDate, type SaahsEvent } from "@/lib/data"

const typeStyles: Record<SaahsEvent["type"], string> = {
  Academic: "bg-primary/10 text-primary",
  Cultural: "bg-brand/10 text-brand",
  Sports: "bg-chart-5/10 text-chart-5",
}

export function EventCard({
  event,
  className,
}: {
  event: SaahsEvent
  className?: string
}) {
  const day = new Date(event.date).toLocaleDateString("en-IN", { day: "2-digit" })
  const month = new Date(event.date).toLocaleDateString("en-IN", { month: "short" })

  return (
    <article
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="text-lg font-bold leading-none">{day}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide">
            {month}
          </span>
        </div>
        <span
          className={cn(
            "inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold",
            typeStyles[event.type],
          )}
        >
          {event.type}
        </span>
      </div>

      <h3 className="mt-4 text-base font-semibold leading-snug text-foreground text-pretty">
        {event.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
        {event.description}
      </p>

      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-brand" />
          {formatDate(event.date)}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-brand" />
          {event.time}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-brand" />
          <span className="truncate">{event.venue}</span>
        </div>
      </dl>
    </article>
  )
}

export { typeStyles }
