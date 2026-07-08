"use client"

import { useState, useMemo } from "react"
import { Search, FileText, Download, FileArchive, ScrollText, BookMarked } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { libraryResources, departments, formatDate, type LibraryResource } from "@/lib/data"

const typeIcon: Record<LibraryResource["type"], typeof FileText> = {
  Notes: BookMarked,
  "Previous Papers": FileArchive,
  SOP: ScrollText,
  Guideline: FileText,
}

const resourceTypes = ["All", "Notes", "Previous Papers", "SOP", "Guideline"]

export function LibraryBrowser({ resources }: { resources: any[] }) {
  const [query, setQuery] = useState("")
  const [type, setType] = useState("All")
  const [dept, setDept] = useState("All")

  const deptOptions = useMemo(() => ["All", ...departments.map((d) => d.short)], [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) => {
      const matchesQuery = !q || r.title.toLowerCase().includes(q)
      const matchesType = type === "All" || r.type === type
      const matchesDept = dept === "All" || r.department === dept
      return matchesQuery && matchesType && matchesDept
    })
  }, [query, type, dept, resources])

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources..."
            className="pl-9"
            aria-label="Search resources"
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="md:w-48" aria-label="Filter by type">
            <SelectValue placeholder="Resource type" />
          </SelectTrigger>
          <SelectContent>
            {resourceTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "All" ? "All Types" : t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="md:w-40" aria-label="Filter by department">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            {deptOptions.map((d) => (
              <SelectItem key={d} value={d}>
                {d === "All" ? "All Departments" : d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "resource" : "resources"} available
      </p>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">No resources match your filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const Icon = typeIcon[r.type] || FileText
            return (
              <Card key={r.id} className="flex h-full flex-col transition-shadow hover:shadow-md">
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="secondary">{r.department}</Badge>
                  </div>
                  <h3 className="font-semibold leading-snug text-foreground text-pretty">{r.title}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">{r.type}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>
                      {r.format} · {r.size}
                    </span>
                    <span>Updated {formatDate(r.updated)}</span>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full gap-2">
                    <a href={r.file_url} target="_blank" rel="noreferrer">
                      <Download className="size-4" />
                      Download
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
