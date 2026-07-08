import Image from "next/image"
import { Quote } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function PresidentMessage() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-brand" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          President&apos;s Message
        </h2>
      </div>

      <Quote className="mt-6 size-8 text-brand/30" />
      <blockquote className="mt-3 text-lg leading-relaxed text-foreground/90 text-pretty">
        SAAHS was founded on a simple conviction — that allied health students
        deserve a strong, unified voice. Together we build a platform that
        nurtures academic excellence, professional growth and a genuine sense of
        community across every department.
      </blockquote>

      <div className="mt-8 flex items-center gap-4 border-t border-border pt-6">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
          <Image
            src="/president.png"
            alt="Dr. Aditi Sharma, President of SAAHS"
            fill
            sizes="56px"
            className="object-cover"
          />
        </span>
        <div>
          <p className="font-semibold text-foreground">Dr. Aditi Sharma</p>
          <p className="text-sm text-muted-foreground">
            President, SAAHS · 2025–2026
          </p>
          <Badge variant="outline" className="mt-1.5">
            Medical Laboratory Technology
          </Badge>
        </div>
      </div>
    </div>
  )
}
