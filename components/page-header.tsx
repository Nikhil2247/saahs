import type { ReactNode } from "react"

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <section className="border-b border-border bg-card dotted-grid">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-widest text-brand">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
              <span className="heading-underline heading-underline-brand">{title}</span>
            </h1>
            {description && (
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">
                {description}
              </p>
            )}
          </div>
          {children && <div className="shrink-0">{children}</div>}
        </div>
      </div>
    </section>
  )
}
