"use client"

import { useEffect, useRef, useState } from "react"
import { Building2, Users, CalendarCheck, TrendingUp, Award } from "lucide-react"

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active, duration])
  return value
}

interface StatItem {
  label: string
  sublabel: string
  value: number
  suffix: string
  icon: typeof Building2
}

export function StatsGrid({ activeMemberCount = 450 }: { activeMemberCount?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const statItems: StatItem[] = [
    {
      label: "Registered Members",
      sublabel: "Across PGIMER & Region",
      value: 1200,
      suffix: "+",
      icon: Users,
    },
    {
      label: "Active Members",
      sublabel: "Verified on Portal",
      value: Math.max(450, activeMemberCount),
      suffix: "+",
      icon: TrendingUp,
    },
    {
      label: "PGIMER Disciplines",
      sublabel: "Under SAAHS Umbrella",
      value: 13,
      suffix: "",
      icon: Building2,
    },
    {
      label: "APMS Founded",
      sublabel: "34+ Years Legacy",
      value: 1992,
      suffix: "",
      icon: CalendarCheck,
    },
  ]

  return (
    <section className="border-b border-border bg-card/40 py-10 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div
          ref={ref}
          className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8"
        >
          {statItems.map((item) => {
            const Icon = item.icon
            const count = useCountUp(item.value, active)
            return (
              <div
                key={item.label}
                className="relative flex flex-col items-center rounded-2xl border border-border bg-card p-5 text-center shadow-xs transition-all hover:border-brand/30 hover:shadow-sm"
              >
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20">
                  <Icon className="size-5" />
                </div>
                <p className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl tabular-nums">
                  {count.toLocaleString("en-IN")}
                  {item.suffix}
                </p>
                <p className="mt-1 text-xs font-bold text-foreground">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{item.sublabel}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
