import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Compass, ShieldCheck } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-background text-foreground">
      {/* ── SAAHS watermark text in background ──────────────────────────── */}
      <span className="saahs-watermark" aria-hidden="true">
        SAAHS
      </span>

      {/* ── Dotted Grid Background ────────────────────────────────────────── */}
      <div className="absolute inset-0 dotted-grid opacity-50" aria-hidden="true" />

      {/* ── Blue radial glow overlay for depth (Light Transparent Blue) ─── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 30% 50%, oklch(0.55 0.16 256 / 0.15) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 80% at 80% 20%, oklch(0.65 0.13 162 / 0.1) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:py-20 lg:grid-cols-2 lg:gap-12">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium backdrop-blur-sm">
            <ShieldCheck className="size-3.5 text-brand" />
            Officially recognised at PGIMER, Chandigarh
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-balance md:text-5xl lg:text-6xl">
            Student Association of{" "}
            <span className="heading-underline heading-underline-brand text-brand">
              Allied Health Sciences
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg text-pretty">
            A unified academic community advancing allied health education,
            leadership and student welfare. We exist to{" "}
            <strong className="text-foreground">Unite, Empower and Elevate</strong>{" "}
            every allied health student across our institute.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/30"
            >
              Join SAAHS
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-5 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary/50"
            >
              <Compass className="size-4" />
              Explore Portal
            </Link>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Established
              </dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">2015</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Member Departments
              </dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">11+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                Active Members
              </dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">1,240+</dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl ring-1 ring-border shadow-xl">
            <Image
              src="/hero-students.png"
              alt="Allied health science students collaborating in a modern laboratory"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-border bg-card/90 p-4 text-card-foreground shadow-lg backdrop-blur-sm sm:block">
            <p className="font-mono text-xs uppercase tracking-widest text-brand">
              Unite · Empower · Elevate
            </p>
            <p className="mt-1 text-sm font-semibold">One voice for allied health</p>
          </div>
        </div>
      </div>
    </section>
  )
}
