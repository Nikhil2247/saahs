import Link from "next/link"
import {
  BookOpen,
  LifeBuoy,
  Trophy,
  ArrowRight,
  FileText,
  ShieldAlert,
  Calendar,
  CheckCircle2,
} from "lucide-react"

export function AcademicWelfareFeatures() {
  return (
    <section className="border-t border-border bg-card/20 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            Student Ecosystem
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Everything Allied Health Students Need
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            From digital academic libraries and confidential welfare support to regional sports leagues and cultural events.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Card 1: E-Library */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-xs transition-all hover:border-brand/40 hover:shadow-md">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand mb-6 ring-1 ring-brand/20">
                <BookOpen className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">SAAHS E-Library &amp; Repository</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Access curated lecture notes, previous year question papers, clinical SOPs, and departmental manuals across all 13 allied health disciplines.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  Peer-reviewed lecture notes &amp; exam banks
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  Standard Operating Procedures (SOPs)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  Free digital access for all members
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border">
              <Link
                href="/e-library"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
              >
                Explore E-Library
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Card 2: Student Welfare & Help Desk */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-xs transition-all hover:border-brand/40 hover:shadow-md">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand mb-6 ring-1 ring-brand/20">
                <LifeBuoy className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Digital Help Desk &amp; Grievance Portal</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Lodge anonymous grievances, track monthly stipend credits, request hostel allotment support, and resolve campus issues rapidly.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  100% confidential grievance option
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  Stipend disbursement tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  Hostel &amp; campus welfare committee
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border">
              <Link
                href="/help-desk"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
              >
                Access Help Desk
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          {/* Card 3: Sports & Campus Life */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-xs transition-all hover:border-brand/40 hover:shadow-md">
            <div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand mb-6 ring-1 ring-brand/20">
                <Trophy className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">SAAHS Sports League &amp; Cultural Fests</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Participate in the flagship SAAHS Sports League at PGIMER Sports Complex, inter-departmental tournaments, and annual cultural nights.
              </p>

              <ul className="mt-6 space-y-2.5 text-xs text-foreground font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  Cricket, Badminton, &amp; Athletics leagues
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  Annual Cultural Night <em>"Aarambh"</em>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-brand shrink-0" />
                  Live match fixtures &amp; team registrations
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border">
              <Link
                href="/sports"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
              >
                View Sports &amp; Events
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
