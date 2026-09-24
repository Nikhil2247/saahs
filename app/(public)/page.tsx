import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Hero } from "@/components/home/hero"
import { PresidentMessage } from "@/components/home/president-message"
import { NoticesFeed } from "@/components/home/notices-feed"
import { MembershipBenefits } from "@/components/home/membership-benefits"
import { StatsGrid } from "@/components/home/stats-grid"
import { FeaturedDepartments } from "@/components/home/featured-departments"
import { EventGalleryPreview } from "@/components/home/event-gallery-preview"
import { UpcomingEvents } from "@/components/home/upcoming-events"
import { getSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const session = await getSession()
  const isLoggedIn = !!session

  return (
    <>
      {/* 1. Hero Banner */}
      <Hero isLoggedIn={isLoggedIn} />

      {/* 2. SECOND SECTION: Important Notices & President's Address */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-2">
          <NoticesFeed />
          <PresidentMessage />
        </div>
      </section>

      {/* 3. Executed Event Photo Gallery Highlights (Captured Moments) */}
      <EventGalleryPreview />

      {/* 4. Upcoming Events & Flagship Conventions */}
      <UpcomingEvents />

      {/* 5. Student Membership Benefits & Website Features Showcase */}
      <MembershipBenefits />

      {/* 6. Portal Member & Institution Statistics */}
      <StatsGrid />

      {/* 7. 13 PGIMER Allied Health Disciplines */}
      <FeaturedDepartments />

      {/* 7. Call to Action Banner */}
      <section className="bg-background border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="relative overflow-hidden flex flex-col items-center gap-6 rounded-3xl border border-border bg-gradient-to-b from-card via-card to-brand/10 px-8 py-16 text-center text-foreground shadow-xl">
            <div className="absolute inset-0 dotted-grid opacity-30" aria-hidden="true" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 70% at 50% 100%, oklch(0.55 0.16 256 / 0.12) 0%, transparent 70%)",
              }}
            />

            <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-4 py-1 text-xs font-semibold text-brand">
              <Sparkles className="size-3.5" />
              PGIMER Allied Health Sciences Community
            </span>

            <h2 className="relative z-10 max-w-3xl text-3xl font-extrabold tracking-tight text-balance md:text-4xl">
              Join the Official SAAHS Student Portal
            </h2>

            <p className="relative z-10 max-w-xl text-base text-muted-foreground text-pretty">
              <strong>FREE Registration for PGIMER Students</strong> · <strong>₹350 Lifetime Registration for Outside Institute Members</strong> with full access to members-only e-library, help desk, and event portals.
            </p>

            <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href={isLoggedIn ? "/dashboard" : "/signup"}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/30"
              >
                {isLoggedIn ? "Go to Dashboard" : "Register on Portal"}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary/50"
              >
                Learn About SAAHS &amp; PGIMER
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
