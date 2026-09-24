import Link from "next/link"
import {
  ArrowRight,
  FlaskConical,
  Activity,
  Stethoscope,
  FileText,
  HeartHandshake,
  Globe,
  ShieldCheck,
  GraduationCap,
  Compass,
  Users,
  Landmark,
  Sparkles,
} from "lucide-react"

const featuredDeps = [
  {
    short: "BMLS",
    name: "Medical Laboratory Science",
    desc: "Diagnostic pathology, hematology, & clinical biochemistry.",
    icon: FlaskConical,
  },
  {
    short: "MRIT",
    name: "Radiology & Imaging Tech",
    desc: "Advanced MRI, CT scanning, ultrasound & digital X-ray.",
    icon: Stethoscope,
  },
  {
    short: "RTT",
    name: "Radiotherapy Technology",
    desc: "Precision radiation oncology treatment & linear accelerator ops.",
    icon: Activity,
  },
  {
    short: "HIM",
    name: "Health Information Management",
    desc: "Health informatics, EHR systems & medical record governance.",
    icon: FileText,
  },
  {
    short: "PT",
    name: "Physiotherapy (BPT)",
    desc: "Physical rehabilitation, sports injury & neurological recovery.",
    icon: HeartHandshake,
  },
  {
    short: "PH",
    name: "Public Health (BPH)",
    desc: "Epidemiology, biostatistics, community health & health policy.",
    icon: Globe,
  },
  {
    short: "OTT",
    name: "Operation Theatre Tech",
    desc: "Surgical instrumentation, anesthesia assistance & sterile ops.",
    icon: ShieldCheck,
  },
  {
    short: "BASLP",
    name: "Audiology & Speech Pathology",
    desc: "Hearing diagnostics, speech therapy & vestibular assessment.",
    icon: Users,
  },
]

export function FeaturedDepartments() {
  return (
    <section className="border-t border-border bg-card/30 py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end mb-12">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              <Sparkles className="size-3.5" />
              13 PGIMER Disciplines
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Allied Health Academic Programs
            </h2>
            <p className="mt-2 max-w-2xl text-base text-muted-foreground">
              SAAHS represents specialized disciplines operating at PGIMER Chandigarh &amp; NIAHS, shaping the future of healthcare.
            </p>
          </div>
          <Link
            href="/departments"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted"
          >
            View All 13 Departments
            <ArrowRight className="size-4 text-brand" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredDeps.map((d) => {
            const Icon = d.icon
            return (
              <div
                key={d.short}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-brand/40 hover:shadow-md"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand ring-1 ring-brand/20">
                      {d.short}
                    </span>
                    <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-brand" />
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-brand transition-colors">
                    {d.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {d.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <span>PGIMER Unit</span>
                  <span className="text-brand font-semibold group-hover:translate-x-0.5 transition-transform">
                    Explore &rarr;
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
