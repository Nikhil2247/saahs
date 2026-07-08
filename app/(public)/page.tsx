import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Hero } from "@/components/home/hero"
import { StatsGrid } from "@/components/home/stats-grid"
import { PresidentMessage } from "@/components/home/president-message"
import { NoticesFeed } from "@/components/home/notices-feed"
import { UpcomingEvents } from "@/components/home/upcoming-events"

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsGrid />

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="grid gap-6 lg:grid-cols-2">
          <PresidentMessage />
          <NoticesFeed />
        </div>
      </section>

      <UpcomingEvents />

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="relative overflow-hidden flex flex-col items-center gap-6 rounded-2xl border border-border bg-card px-6 py-12 text-center text-foreground shadow-md">
            <div className="absolute inset-0 dotted-grid opacity-40" aria-hidden="true" />
            <h2 className="relative z-10 max-w-2xl text-2xl font-bold tracking-tight text-balance md:text-3xl">
              Become part of a community that unites, empowers and elevates
            </h2>
            <p className="relative z-10 max-w-xl text-muted-foreground text-pretty">
              Register through the portal to access events, the e-library,
              welfare support and a network of allied health peers.
            </p>
            <Link
              href="/dashboard"
              className="relative z-10 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20"
            >
              Join SAAHS Today
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
