import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function BrandMark({
  className,
  showText = true,
  invert = false,
}: {
  className?: string
  showText?: boolean
  invert?: boolean
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <span className="relative inline-flex size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
        <Image
          src="/saahs-logo.jpeg"
          alt="SAAHS seal"
          fill
          sizes="40px"
          className="object-cover"
          priority
        />
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "text-base font-bold tracking-tight",
              invert ? "text-primary-foreground" : "text-foreground",
            )}
          >
            SAAHS
          </span>
          <span
            className={cn(
              "mt-0.5 text-[10px] font-medium tracking-wide",
              invert ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            Allied Health Sciences · PGIMER
          </span>
        </span>
      )}
    </Link>
  )
}
