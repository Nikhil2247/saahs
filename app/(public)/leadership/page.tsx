import type { Metadata } from "next"
import { Mail, ShieldCheck, Crown, Users, GraduationCap, Award, Sparkles, Building2, UserCheck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { officeBearers, departmentalRepresentatives } from "@/lib/data"
import { DepartmentsGrid } from "@/app/(public)/departments/departments-grid"

export const metadata: Metadata = {
  title: "Leadership & Courses | SAAHS PGIMER",
  description:
    "Meet the Governing Body Members, Committee Secretaries, Executive Committee Departmental Representatives, and explore all 13 Allied Health Science courses at PGIMER Chandigarh.",
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
  const president = officeBearers.find((m) => m.position === "President") || officeBearers[0]
  
  // Governing Body Core Officers
  const centralOfficers = officeBearers.filter((m) =>
    ["President", "Vice President", "Treasurer", "General Secretary", "Joint Secretary", "Additional Secretary"].includes(m.position)
  )

  // Governing Body Committee Secretaries
  const committeeSecretaries = officeBearers.filter(
    (m) => !["President", "Vice President", "Treasurer", "General Secretary", "Joint Secretary", "Additional Secretary"].includes(m.position)
  )

  const otherCentralOfficers = centralOfficers.filter((m) => m.id !== president.id)

  return (
    <div>
      <PageHeader
        eyebrow="Governance & Academics"
        title="Leadership &amp; Allied Health Courses"
        description="Meet the Governing Body Officers, Committee Secretaries, Executive Committee Departmental Representatives (DRs), and explore all 13 Allied Health Science courses at PGIMER Chandigarh."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 space-y-16">
        
        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: GOVERNING BODY MEMBERS
        ══════════════════════════════════════════════════════════════ */}
        <section id="governing-body" className="scroll-mt-24">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-500">
              <Crown className="size-3.5" />
              Central Officers &amp; Governance
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Governing Body Members (2025 – 2026)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The primary elected officers leading policy, institutional alignment, financial governance, and student advocacy across PGIMER.
            </p>
          </div>

          {/* President Spotlight Card */}
          {president && (
            <Card className="mb-8 overflow-hidden border-2 border-brand/40 bg-card shadow-md transition-all hover:shadow-lg">
              <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center md:p-8">
                <Avatar className="size-20 shrink-0 border-2 border-brand md:size-24 ring-4 ring-brand/10">
                  <AvatarFallback className="bg-brand text-xl font-extrabold text-brand-foreground">
                    {initials(president.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <Badge className="bg-brand text-brand-foreground font-bold px-3 py-1 text-xs">
                      {president.position}
                    </Badge>
                    <Badge variant="outline" className="border-brand/30 bg-brand/10 text-brand text-xs font-semibold">
                      Head of Governing Body
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-extrabold text-foreground">{president.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{president.department}</p>
                  
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium pt-3 border-t border-border">
                    <a
                      href={`mailto:${president.email}`}
                      className="inline-flex items-center gap-1.5 text-brand hover:underline font-semibold"
                    >
                      <Mail className="size-4" />
                      {president.email}
                    </a>
                    <span className="text-muted-foreground font-mono">Tenure {president.tenure}</span>
                    <span className="text-muted-foreground">PGIMER Central Office (Research Block B)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Central Governing Officers */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {otherCentralOfficers.map((member) => (
              <Card key={member.id} className="border border-border bg-card transition-all hover:border-brand/40 hover:shadow-md">
                <CardContent className="flex flex-col justify-between h-full p-6">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="size-14 shrink-0 border border-border ring-2 ring-brand/10">
                        <AvatarFallback className="bg-brand/10 font-bold text-brand text-base">
                          {initials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Badge variant="outline" className="mb-1 text-[10px] font-bold border-brand/30 bg-brand/10 text-brand">
                          {member.position}
                        </Badge>
                        <h4 className="truncate font-extrabold text-foreground text-base">{member.name}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                      <GraduationCap className="size-3.5 text-brand shrink-0" />
                      {member.department}
                    </p>
                  </div>

                  <div className="mt-5 border-t border-border pt-3 flex items-center justify-between text-xs">
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-1.5 text-brand font-semibold hover:underline"
                    >
                      <Mail className="size-3.5" />
                      <span className="truncate">{member.email}</span>
                    </a>
                    <span className="text-[11px] font-mono text-muted-foreground">{member.tenure}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Committee Secretaries under Governing Body */}
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="size-5 text-brand" />
              Governing Body Committee Secretaries
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {committeeSecretaries.map((member) => (
                <Card key={member.id} className="border border-border bg-card/60 transition-all hover:border-brand/40">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="size-10 shrink-0 border border-border">
                      <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
                        {initials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">
                        {member.position}
                      </span>
                      <h4 className="font-bold text-foreground text-sm truncate">{member.name}</h4>
                      <p className="text-[11px] text-muted-foreground truncate">{member.department}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: EXECUTIVE COMMITTEE (DEPARTMENTAL REPRESENTATIVES)
        ══════════════════════════════════════════════════════════════ */}
        <section id="executive-committee" className="scroll-mt-24 border-t border-border pt-12">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
              <Users className="size-3.5" />
              Departmental Representation
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              Executive Committee (Departmental Representatives)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Comprising elected Departmental Representatives (DRs) for each of the 13 allied health departments, advocating directly for registered student members.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departmentalRepresentatives.map((dr) => (
              <Card key={dr.id} className="border border-border bg-card transition-all hover:border-brand/40 hover:shadow-md">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-xs font-bold text-brand ring-1 ring-brand/20">
                        {dr.shortCode}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-semibold border-brand/30 text-brand">
                        Executive DR
                      </Badge>
                    </div>

                    <h4 className="font-bold text-foreground text-base leading-snug">{dr.name}</h4>
                    <p className="text-xs text-brand font-semibold mt-0.5">{dr.role}</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{dr.department}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1 text-brand font-semibold">
                      <UserCheck className="size-3.5" />
                      Executive Committee Member
                    </span>
                    <span className="font-mono text-[11px]">{dr.tenure}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3: ALLIED HEALTH COURSES & DISCIPLINES
        ══════════════════════════════════════════════════════════════ */}
        <section id="courses" className="scroll-mt-24 border-t border-border pt-12">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
              <Sparkles className="size-3.5" />
              13 PGIMER Programs
            </span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Allied Health Courses &amp; Disciplines
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              SAAHS represents thirteen specialized allied health science disciplines operating under PGIMER Chandigarh &amp; NIAHS.
            </p>
          </div>

          <DepartmentsGrid />
        </section>

      </div>
    </div>
  )
}
