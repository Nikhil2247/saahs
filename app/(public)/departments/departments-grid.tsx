"use client"

import { useState, useMemo } from "react"
import { Search, Users, UserCog } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { departments } from "@/lib/data"

export function DepartmentsGrid() {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return departments
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.short.toLowerCase().includes(q) ||
        d.coordinator.toLowerCase().includes(q),
    )
  }, [query])

  return (
    <div>
      <div className="relative mb-8 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search departments or coordinators..."
          className="pl-9"
          aria-label="Search departments"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No departments match your search.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card key={d.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {d.short}
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Users className="size-3" />
                    {d.members}
                  </Badge>
                </div>
                <h3 className="font-semibold leading-snug text-foreground text-pretty">{d.name}</h3>
                <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserCog className="size-4 shrink-0 text-brand" />
                  <span>Coordinator: {d.coordinator}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
