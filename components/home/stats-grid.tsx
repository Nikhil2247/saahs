"use client"

import { useEffect, useRef, useState } from "react"
import { Building2, Users, CalendarCheck, TrendingUp } from "lucide-react"
import { stats } from "@/lib/data"

const icons = [Building2, Users, CalendarCheck, TrendingUp]

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

function StatCard({
  icon: Icon,
  value,
  suffix,
  label,
  active,
}: {
  icon: typeof Building2
  value: number
  suffix: string
  label: string
  active: boolean
}) {
  const count = useCountUp(value, active)
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground tabular-nums">
        {count.toLocaleString("en-IN")}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

export function StatsGrid() {
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
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div ref={ref} className="grid grid-cols-2 gap-4 lg:grid-cols-4 dotted-grid rounded-xl bg-card p-6 border border-border shadow-sm">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            icon={icons[i]}
            value={s.value}
            suffix={s.suffix}
            label={s.label}
            active={active}
          />
        ))}
      </div>
    </section>
  )
}
