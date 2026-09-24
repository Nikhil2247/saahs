import Link from "next/link"
import { ArrowRight, Shield, Award, User, GraduationCap } from "lucide-react"

const officeBearersPreview = [
  {
    name: "Aditya",
    role: "President",
    dept: "Radiotherapy",
    status: "Intern Radiotherapy, PGIMER",
  },
  {
    name: "Shreyasi Sharma",
    role: "Vice President",
    dept: "Radiodiagnosis",
    status: "PGIMER Allied Scholar",
  },
  {
    name: "Swastik",
    role: "Treasurer",
    dept: "Public Health & Community Medicine",
    status: "PGIMER Allied Scholar",
  },
  {
    name: "Anubhav Maurya",
    role: "General Secretary",
    dept: "Physiotherapy",
    status: "PGIMER Allied Scholar",
  },
]

export function LeadershipPreview() {
  return (
    <section className="border-t border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end mb-12">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Award className="size-3.5" />
              Executive Council 2025–2026
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Student Leadership &amp; Governance
            </h2>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              Elected student representatives advocating for academic excellence, student welfare, and national recognition across all 13 departments.
            </p>
          </div>

          <Link
            href="/leadership"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-all hover:bg-muted"
          >
            Meet Full Leadership Body
            <ArrowRight className="size-4 text-brand" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {officeBearersPreview.map((leader) => (
            <div
              key={leader.name}
              className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:border-brand/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20 shadow-xs">
                  <Shield className="size-5" />
                </div>
                <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
                  {leader.role}
                </span>
              </div>

              <h3 className="text-lg font-bold text-foreground">{leader.name}</h3>
              <p className="mt-1 text-xs font-semibold text-brand flex items-center gap-1">
                <GraduationCap className="size-3.5" />
                {leader.dept}
              </p>
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {leader.status}
              </p>

              <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                <span>Tenure 2025-26</span>
                <span className="font-bold text-foreground">PGIMER HQ</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
