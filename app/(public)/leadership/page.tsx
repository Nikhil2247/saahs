import type { Metadata } from "next"
import { Mail } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { officeBearers } from "@/lib/data"

export const metadata: Metadata = {
  title: "Leadership | SAAHS",
  description:
    "Meet the elected office bearers of the Student Association of Allied Health Sciences, PGIMER Chandigarh.",
}

function initials(name: string) {
  return name
    .split(" ")
    .filter((p) => !p.includes("."))
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
}

export default function LeadershipPage() {
  const [president, ...council] = officeBearers

  return (
    <div>
      <PageHeader
        eyebrow="Governance"
        title="Governing Body 2025 – 2026"
        description="The elected representatives leading SAAHS across academics, culture, sports and student welfare."
      />

      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* President highlight */}
        <Card className="mb-10 overflow-hidden border-l-4 border-l-primary">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center md:p-8">
            <Avatar className="size-20 shrink-0 border border-border md:size-24">
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {initials(president.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Badge className="mb-2 bg-primary/10 text-primary">{president.position}</Badge>
              <h2 className="text-xl font-semibold text-foreground">{president.name}</h2>
              <p className="text-sm text-muted-foreground">{president.department}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <a
                  href={`mailto:${president.email}`}
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Mail className="size-4" />
                  {president.email}
                </a>
                <span className="text-muted-foreground">Tenure {president.tenure}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Council grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {council.map((member) => (
            <Card key={member.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col items-start gap-4 p-6">
                <div className="flex w-full items-center gap-4">
                  <Avatar className="size-14 shrink-0 border border-border">
                    <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">
                      {initials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{member.name}</h3>
                    <p className="text-sm font-medium text-brand">{member.position}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{member.department}</p>
                <div className="mt-auto w-full border-t border-border pt-3">
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Mail className="size-3.5" />
                    <span className="truncate">{member.email}</span>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
