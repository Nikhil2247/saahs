import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Globe,
  Award,
  Network,
  MapPin,
  Landmark,
  Users,
  CheckCircle2,
  Target,
  Compass,
  CalendarDays,
  FlaskConical,
  Stethoscope,
  Activity,
  Building2,
  ShieldCheck,
  Sparkles,
  FileText,
} from "lucide-react"
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"

export const metadata: Metadata = {
  title: "About | SAAHS — PGIMER & NIAHS Chandigarh",
  description:
    "Learn about SAAHS, based at PGIMER Chandigarh & NIAHS — representing 1,200+ registered members and 450+ active members across allied health disciplines.",
}

export const dynamic = "force-dynamic"

// ─── Fetch live member counts from Supabase ───────────────────────────────────

async function getMemberStats() {
  try {
    const supabase = createSupabaseAdminClient()

    const [{ count: totalCount }, { count: activeCount }, { count: pgCount }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .neq("role", "Public User"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("membership_status", "Approved"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_pgimer_student", true)
        .eq("membership_status", "Approved"),
    ])

    return {
      total: Math.max(1200, totalCount ?? 0),
      active: Math.max(450, activeCount ?? 0),
      pgimer: pgCount ?? 0,
    }
  } catch {
    return { total: 1200, active: 450, pgimer: 0 }
  }
}

// ─── Static data ──────────────────────────────────────────────────────────────

const timeline = [
  {
    year: "1992",
    icon: Users,
    label: "APMS Founded at PGIMER",
    description:
      "Students at PGIMER recognized the need for a structured voice for allied health disciplines. The Association of Paramedical Students (APMS) was established — bridging Laboratory Technology, Radiotherapy, Radiodiagnosis and more under NIPS.",
  },
  {
    year: "1992 – 2024",
    icon: BookOpen,
    label: "Three Decades of Student Welfare",
    description:
      "For over 30 years, APMS served as the backbone of student welfare and campus coordination for allied health students at PGIMER Chandigarh. Academic events, student representation, and departmental collaboration were hallmarks of this era.",
  },
  {
    year: "2024",
    icon: Landmark,
    label: "NIPS Elevated to NIAHS",
    description:
      "Following a directive from the Ministry of Health and Family Welfare, the National Institute of Paramedical Sciences (NIPS) at PGIMER was officially elevated to the National Institute of Allied and Healthcare Sciences (NIAHS).",
  },
  {
    year: "2026",
    icon: Award,
    label: "SAAHS — Officially Constituted",
    description:
      "Under the leadership of its founding President Aditya (Intern Radiotherapy), SAAHS was formally constituted — widening scope to include Bachelor of Public Health (BPH), Bachelor of Physiotherapy (BPT), Health Information Management (HIM), and all allied health streams at PGIMER.",
  },
]

const pillars = [
  {
    icon: GraduationCap,
    title: "Academic Priority",
    body: "Rigorous learning, clinical competence, and research excellence across every department — our primary, unwavering focus.",
    accent: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: Award,
    title: "National Recognition",
    body: "Building a platform that earns national-level recognition for the invaluable contributions of allied health professionals.",
    accent: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
    iconColor: "text-amber-500",
  },
  {
    icon: Network,
    title: "National Alignment",
    body: "Setting benchmarks, sharing resources, and providing collaborative academic benefits to allied health institutions nationwide.",
    accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  {
    icon: HeartHandshake,
    title: "Student Welfare",
    body: "Advocating for fair representation, academic support, and a healthy, inclusive campus environment for every member.",
    accent: "from-rose-500/20 to-rose-500/5 border-rose-500/20",
    iconColor: "text-rose-500",
  },
]

const niahsDisciplines = [
  { icon: FlaskConical, label: "Medical Laboratory Science (BMLS)" },
  { icon: Stethoscope, label: "Radiology & Imaging (MRIT)" },
  { icon: Activity, label: "Radiotherapy Technology (RTT)" },
  { icon: FileText, label: "Health Information Management (HIM)" },
  { icon: HeartHandshake, label: "Physiotherapy (PT)" },
  { icon: Globe, label: "Public Health (PH)" },
  { icon: ShieldCheck, label: "Operation Theatre Tech (OTT)" },
  { icon: Activity, label: "Perfusionist Technology (MTP)" },
  { icon: GraduationCap, label: "Dialysis Therapy (MTDT)" },
  { icon: Compass, label: "Optometry (OPT)" },
  { icon: Users, label: "Speech-Language Pathology (BASLP)" },
  { icon: Landmark, label: "Embalming & Mortuary Science" },
  { icon: Sparkles, label: "Medical Animation (MAAV)" },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default async function AboutPage() {
  const stats = await getMemberStats()

  const statCards = [
    { value: "2026", label: "Year Founded" },
    { value: `${stats.total.toLocaleString()}+`, label: "Registered Members" },
    { value: `${stats.active.toLocaleString()}+`, label: "Active Members" },
    { value: "13", label: "PGIMER Departments" },
  ]

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] overflow-hidden bg-background">
        {/* Background radial glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 10% 50%, oklch(0.55 0.16 256 / 0.12) 0%, transparent 65%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 90% 20%, oklch(0.65 0.13 162 / 0.08) 0%, transparent 60%)",
          }}
        />
        <div className="absolute inset-0 dotted-grid opacity-40" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:py-28 lg:grid-cols-2 lg:gap-16">
          {/* Left — text */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                <CheckCircle2 className="size-3.5" />
                Recognized by PGIMER &amp; NIAHS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Founded 2026
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-balance md:text-5xl lg:text-6xl">
              <span className="text-foreground">Shaping the Future of</span>
              <br />
              <span className="heading-underline heading-underline-brand text-brand">
                Allied Health Sciences
              </span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg text-pretty">
              The Student Association of Allied Health Sciences (SAAHS) is the unified academic body representing all allied health professionals in training at{" "}
              <strong className="text-foreground">PGIMER Chandigarh</strong> — committed to academic excellence, student welfare, and elevating the allied health profession nationally.
            </p>

            {/* President callout (No image component, icon badge) */}
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 backdrop-blur-sm w-fit shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-full bg-brand/10 ring-2 ring-brand/20 text-brand shrink-0">
                <GraduationCap className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Aditya</p>
                <p className="text-xs text-muted-foreground">Founding President · Intern Radiotherapy, PGIMER</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/30"
              >
                Join SAAHS
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/departments"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-5 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary/50"
              >
                <GraduationCap className="size-4" />
                Our Departments
              </Link>
            </div>
          </div>

          {/* Right — image collage */}
          <div className="relative hidden lg:block">
            {/* Main image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-border shadow-2xl">
              <Image
                src="/about-hero.png"
                alt="Allied health sciences students and professionals at PGIMER"
                fill
                sizes="40vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>

            {/* Floating stat card — top left */}
            <div className="absolute -left-6 -top-6 rounded-2xl border border-border bg-card/90 p-4 shadow-xl backdrop-blur-sm">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-brand font-bold">Registered</p>
              <p className="mt-0.5 text-2xl font-extrabold text-foreground">1,200+</p>
              <p className="text-xs text-muted-foreground">Total Members</p>
            </div>

            {/* Floating stat card — bottom right */}
            <div className="absolute -bottom-6 -right-6 rounded-2xl border border-border bg-card/90 p-4 shadow-xl backdrop-blur-sm">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-brand font-bold">Active Members</p>
              <p className="mt-0.5 text-2xl font-extrabold text-foreground">
                {stats.active.toLocaleString()}+
              </p>
              <p className="text-xs text-muted-foreground font-medium">Verified Active</p>
            </div>

            {/* Floating tag — bottom left */}
            <div className="absolute -bottom-4 left-6 flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 shadow-lg backdrop-blur-sm">
              <MapPin className="size-3.5 text-brand" />
              <span className="text-xs font-medium text-foreground">NIAHS, PGIMER, Chandigarh</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 md:grid-cols-4">
            {statCards.map((s) => (
              <div key={s.label} className="flex flex-col items-center py-6 text-center">
                <span className="text-3xl font-extrabold tracking-tight text-brand">{s.value}</span>
                <span className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          POSTGRADUATE INSTITUTE OF MEDICAL EDUCATION & RESEARCH (PGIMER) SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left: Content */}
            <div className="lg:col-span-7">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500">
                  <ShieldCheck className="size-3.5" />
                  Institute of National Importance (INI)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Landmark className="size-3.5 text-brand" />
                  Est. 1962 by Act of Parliament
                </span>
              </div>

              <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                Postgraduate Institute of Medical Education and Research (PGIMER)
              </h2>
              <p className="mb-1 text-base font-semibold text-brand">
                Chandigarh, India · Premier Autonomous Medical &amp; Research Apex Institution
              </p>

              <p className="mb-5 mt-4 text-base leading-relaxed text-muted-foreground">
                Established in 1962, PGIMER Chandigarh stands as one of India&#39;s premier medical research and educational institutions. Designated as an <strong className="text-foreground">Institute of National Importance (INI)</strong> by an Act of Parliament, PGIMER is globally recognized for world-class tertiary patient care, cutting-edge clinical research, and training leaders in medical and allied health sciences.
              </p>
              <p className="mb-6 text-base leading-relaxed text-muted-foreground">
                SAAHS operates directly within the PGIMER campus, headquartered at <strong className="text-foreground">Research Block B (Room 6013)</strong>. Across 13 specialized Allied Health Science departments, PGIMER trains healthcare professionals in Medical Laboratory Science, Radiotherapy, Radiology &amp; Imaging, Physiotherapy, Public Health, and Health Information Management.
              </p>

              {/* PGIMER Feature Badges */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-background/80 p-3.5">
                  <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">National Status</p>
                  <p className="mt-1 text-sm font-bold text-foreground">Institute of National Importance</p>
                </div>
                <div className="rounded-xl border border-border bg-background/80 p-3.5">
                  <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">Founding Year</p>
                  <p className="mt-1 text-sm font-bold text-foreground">1962 (Act of Parliament)</p>
                </div>
                <div className="rounded-xl border border-border bg-background/80 p-3.5">
                  <p className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">Campus HQ</p>
                  <p className="mt-1 text-sm font-bold text-foreground">Research Block B, PGIMER</p>
                </div>
              </div>
            </div>

            {/* Right: Graphic Card with Stats */}
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card/90 to-brand/10 p-8 shadow-2xl">
                <div className="absolute -right-10 -top-10 size-48 rounded-full bg-brand/10 blur-3xl" aria-hidden="true" />
                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg shadow-brand/20">
                      <Building2 className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">PGIMER Allied Health Ecosystem</h3>
                      <p className="text-xs text-muted-foreground">Chandigarh, Sector 12</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background/60 p-3 backdrop-blur-sm">
                      <span className="text-xs font-medium text-muted-foreground">Registered Allied Professionals</span>
                      <span className="font-mono text-sm font-bold text-brand">1,200+</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background/60 p-3 backdrop-blur-sm">
                      <span className="text-xs font-medium text-muted-foreground">Active On-Portal Members</span>
                      <span className="font-mono text-sm font-bold text-brand">450+</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background/60 p-3 backdrop-blur-sm">
                      <span className="text-xs font-medium text-muted-foreground">PGIMER Allied Departments</span>
                      <span className="font-mono text-sm font-bold text-brand">13 Disciplines</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-background/60 p-3 backdrop-blur-sm">
                      <span className="text-xs font-medium text-muted-foreground">Academic &amp; Student Body</span>
                      <span className="font-mono text-sm font-bold text-emerald-500">SAAHS Union</span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between rounded-xl bg-brand/10 p-4 text-xs font-medium text-brand">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-4 shrink-0" />
                      Recognized Apex Body for Student Welfare
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          WHO WE ARE
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Image */}
            <div className="relative">
              <div className="aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-border shadow-xl">
                <Image
                  src="/about-students.png"
                  alt="SAAHS students collaborating in a clinical lab"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
              {/* Office badge */}
              <div className="absolute -bottom-5 left-4 right-4 rounded-xl border border-border bg-card/95 px-5 py-4 shadow-xl backdrop-blur-sm sm:left-8 sm:right-auto">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">Central Office</p>
                    <p className="mt-0.5 text-sm font-medium text-foreground">
                      Room 6013, 6th Floor, Research Block B
                    </p>
                    <p className="text-xs text-muted-foreground">NIAHS, PGIMER, Chandigarh</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="pt-8 lg:pt-0">
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-brand">
                Our Identity
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                The Voice of Allied Health at India&#39;s Apex Institute
              </h2>
              <p className="mb-5 text-base leading-relaxed text-muted-foreground">
                SAAHS is an academic, student-led organisation based at PGIMER Chandigarh. We represent the
                collective voice, academic aspirations, and professional growth of allied health professionals
                in training. While campus life and the student community are vital, our primary, unwavering
                focus will always be{" "}
                <strong className="text-foreground">academic excellence</strong>.
              </p>
              <p className="mb-8 text-base leading-relaxed text-muted-foreground">
                Recognized by both PGIMER and NIAHS, SAAHS sits at the heart of the national institute —
                carrying a deep responsibility to align our goals not just locally, but to directly benefit
                and elevate allied health institutions across the nation.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                  <Target className="mx-auto mb-2 size-5 text-brand" />
                  <p className="text-sm font-semibold text-foreground">Mission</p>
                  <p className="mt-1 text-xs text-muted-foreground">Unite, Empower, Elevate</p>
                </div>
                <div className="rounded-xl border border-border bg-card px-4 py-4 text-center">
                  <Compass className="mx-auto mb-2 size-5 text-brand" />
                  <p className="text-sm font-semibold text-foreground">Vision</p>
                  <p className="mt-1 text-xs text-muted-foreground">National Allied Health Leader</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STORY TIMELINE
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-14 text-center">
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Our Journey
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              A Legacy Built Over Decades
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              From a student organization founded in 1992 at PGIMER to a nationally recognized body under NIAHS — SAAHS
              carries forward a proud heritage while charting an ambitious future.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative mx-auto max-w-4xl">
            {/* Vertical line */}
            <div className="absolute left-[22px] top-6 bottom-6 w-px bg-gradient-to-b from-brand/60 via-brand/30 to-transparent md:left-1/2 md:-translate-x-px" />

            <div className="flex flex-col gap-12">
              {timeline.map((item, idx) => {
                const Icon = item.icon
                const isEven = idx % 2 === 0
                return (
                  <div
                    key={item.year}
                    className={`relative flex gap-6 md:gap-0 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
                  >
                    {/* Icon bubble */}
                    <div className="relative z-10 flex shrink-0 md:w-1/2 md:justify-center">
                      <div className="flex size-11 items-center justify-center rounded-full border-2 border-brand bg-card shadow-md shadow-brand/10">
                        <Icon className="size-5 text-brand" />
                      </div>
                    </div>

                    {/* Card */}
                    <div className={`flex-1 md:w-1/2 ${isEven ? "md:pl-8" : "md:pr-8"}`}>
                      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                        <span className="mb-2 inline-block rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                          {item.year}
                        </span>
                        <h3 className="mb-1.5 font-semibold text-foreground">{item.label}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          NIAHS SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Text */}
            <div className="order-2 lg:order-1">
              <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-brand">
                Our Academic Home
              </p>
              <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                National Institute of Allied and Healthcare Sciences
              </h2>
              <p className="mb-1 text-lg font-semibold text-brand">NIAHS — formerly NIPS</p>

              <p className="mb-5 mt-4 text-base leading-relaxed text-muted-foreground">
                The National Institute of Allied and Healthcare Sciences (NIAHS) is the dedicated academic
                division within PGIMER Chandigarh responsible for all allied health education programs. Originally
                established as the{" "}
                <strong className="text-foreground">
                  National Institute of Paramedical Sciences (NIPS)
                </strong>
                , it was officially elevated to NIAHS in 2024 by a Ministry of Health and Family Welfare
                directive — a landmark recognition of the expanding scope and national importance of allied
                health disciplines.
              </p>
              <p className="mb-8 text-base leading-relaxed text-muted-foreground">
                NIAHS operates under the prestigious PGIMER umbrella, benefiting from world-class clinical
                infrastructure, multi-specialty exposure, and a research-intensive environment. It prepares
                allied health graduates who are not only technically proficient, but equipped to function in
                advanced tertiary care settings and contribute to public health nationwide.
              </p>

              {/* Disciplines grid */}
              <div>
                <p className="mb-3 text-sm font-semibold text-foreground">Disciplines under NIAHS</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {niahsDisciplines.map((d) => {
                    const Icon = d.icon
                    return (
                      <div
                        key={d.label}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                      >
                        <Icon className="size-3.5 shrink-0 text-brand" />
                        <span className="text-xs font-medium text-foreground">{d.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="relative order-1 lg:order-2">
              <div className="aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-border shadow-xl">
                <Image
                  src="/niahs-building.png"
                  alt="NIAHS Research Block B building at PGIMER Chandigarh"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>

              {/* Ministry badge */}
              <div className="absolute -bottom-5 right-4 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur-sm">
                <p className="text-xs font-semibold text-brand">Ministry of Health &amp; Family Welfare</p>
                <p className="text-xs text-muted-foreground">Government of India — Apex Directive, 2024</p>
              </div>

              {/* Year badge */}
              <div className="absolute -top-4 right-8 rounded-full border border-brand/30 bg-brand/10 px-4 py-2 backdrop-blur-sm">
                <p className="text-xs font-bold text-brand">PGIMER Est. 1962</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CORE MISSION PILLARS
      ══════════════════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-14 text-center">
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-brand">
              Core Mission
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">What Drives Us</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
              Four interconnected pillars that define our purpose and guide every initiative we undertake.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => {
              const Icon = p.icon
              return (
                <div
                  key={p.title}
                  className={`relative overflow-hidden rounded-2xl border bg-gradient-to-b p-6 ${p.accent}`}
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
                    <Icon className={`size-5 ${p.iconColor}`} />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FUTURE VISION CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <div className="absolute inset-0 dotted-grid opacity-30" aria-hidden="true" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 70% 80% at 50% 100%, oklch(0.55 0.16 256 / 0.1) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10 grid gap-12 px-6 py-16 md:px-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-brand">
                  Looking Ahead
                </p>
                <h2 className="mb-5 text-3xl font-bold tracking-tight text-balance md:text-4xl">
                  Our Vision Beyond Campus Walls
                </h2>
                <p className="mb-4 text-base leading-relaxed text-muted-foreground">
                  SAAHS is actively building a collaborative academic network spanning the entire Northern
                  region — connecting allied health courses across Chandigarh, Punjab, Haryana, and beyond.
                </p>
                <p className="text-base leading-relaxed text-muted-foreground">
                  Our long-term goal is to directly shape the future of healthcare education in India, ensuring
                  allied health sciences receive the recognition, resources, and respect they rightfully deserve.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {[
                  { icon: Globe, text: "Connect allied health institutions across India" },
                  { icon: Network, text: "Build a national collaborative academic network" },
                  { icon: Award, text: "Set benchmarks for allied health education standards" },
                  { icon: GraduationCap, text: "Integrate new allied health disciplines continuously" },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.text}
                      className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 backdrop-blur-sm"
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg bg-brand/10">
                        <Icon className="size-4 text-brand" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.text}</span>
                    </div>
                  )
                })}

                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/30"
                >
                  Become Part of the Movement
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
