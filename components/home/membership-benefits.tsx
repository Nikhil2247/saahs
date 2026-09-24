import Link from "next/link"
import {
  CheckCircle2,
  Sparkles,
  GraduationCap,
  CreditCard,
  Lock,
  ArrowRight,
  BookOpen,
  LifeBuoy,
  Trophy,
  ShieldCheck,
  IdCard,
} from "lucide-react"

export function MembershipBenefits() {
  return (
    <section className="border-t border-border bg-card/40 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
            <Sparkles className="size-3.5" />
            05. Portal Membership &amp; Access
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Why Join the SAAHS Portal?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Unlock exclusive members-only features, academic digital repositories, welfare support, and campus event registrations across all allied health disciplines.
          </p>
        </div>

        {/* 2-Column Membership Tier Cards */}
        <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto mb-16">
          {/* Card 1: PGIMER Students (FREE) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-brand/40 bg-card p-8 shadow-md transition-all hover:shadow-xl">
            <div className="absolute top-0 right-0 rounded-bl-2xl bg-brand px-4 py-1 text-xs font-bold text-brand-foreground">
              FREE FOR PGIMER
            </div>

            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand mb-5 ring-1 ring-brand/20">
                <GraduationCap className="size-6" />
              </div>

              <h3 className="text-2xl font-extrabold text-foreground">PGIMER Students</h3>
              <p className="mt-1 text-xs font-semibold text-brand">Chandigarh Campus Scholars</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-foreground">FREE</span>
                <span className="text-xs text-muted-foreground">/ 100% Complimentary</span>
              </div>

              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Instant registration and verified access for all currently enrolled allied health students at PGIMER Chandigarh.
              </p>

              <ul className="mt-6 space-y-3 text-xs font-medium text-foreground">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>Verified PGIMER Student Status</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>Unlimited E-Library &amp; Study Notes Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>Direct Stipend Credit &amp; Hostel Help Desk</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>Confidential Grievance Lodging</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>Free Sports League &amp; Cultural Fest Registrations</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border">
              <Link
                href="/signup"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground shadow-sm transition-all hover:bg-brand/90"
              >
                Register Free with PGIMER ID
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Other Institute Members (₹350 Lifetime) */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-md transition-all hover:border-brand/40 hover:shadow-xl">
            <div className="absolute top-0 right-0 rounded-bl-2xl bg-muted px-4 py-1 text-xs font-bold text-muted-foreground">
              ALL INSTITUTES
            </div>

            <div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand mb-5 ring-1 ring-brand/20">
                <CreditCard className="size-6" />
              </div>

              <h3 className="text-2xl font-extrabold text-foreground">Other Institute Members</h3>
              <p className="mt-1 text-xs font-semibold text-brand">All Allied Institutions Across India</p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-foreground">₹350</span>
                <span className="text-xs font-semibold text-muted-foreground">/ One-time Lifetime Fee</span>
              </div>

              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Full lifetime membership for allied health students and delegates from external medical colleges and universities.
              </p>

              <ul className="mt-6 space-y-3 text-xs font-medium text-foreground">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>One-Time Lifetime Portal Registration (₹350)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>Exclusive Members-Only Section Access</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>Full E-Library Notes, SOPs &amp; Clinical Guidelines</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>Delegate Access to National Conventions &amp; Events</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  <span>Verified Digital Membership Badge</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border">
              <Link
                href="/signup"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-xs transition-all hover:bg-muted"
              >
                Join with Lifetime Membership (₹350)
                <ArrowRight className="size-4 text-brand" />
              </Link>
            </div>
          </div>
        </div>

        {/* Website Features Grid */}
        <div className="rounded-3xl border border-border bg-background p-8 md:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-brand">
              Members-Only Features
            </span>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              What You Get Inside the Portal
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <BookOpen className="size-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">E-Library Repository</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Download subject notes, past question papers, and clinical SOPs across 13 disciplines.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <LifeBuoy className="size-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">Confidential Help Desk</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Lodge anonymous grievances, request hostel allotment help, and track stipend disbursements.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Trophy className="size-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">Sports &amp; Event Portal</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Register teams for the SAAHS Premier Sports League and annual cultural conventions.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <IdCard className="size-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">Verified Member ID</h4>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Get an official digital SAAHS membership credential for delegate verification and event entry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
