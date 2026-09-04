import type { Metadata } from "next"
import { Target, Compass, Users, Award, HeartHandshake, GraduationCap, Globe } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { stats } from "@/lib/data"

export const metadata: Metadata = {
  title: "About | SAAHS",
  description:
    "About the Student Association of Allied Health Sciences (SAAHS), PGIMER Chandigarh — mission, vision and values.",
}

const values = [
  {
    icon: GraduationCap,
    title: "Academic Excellence",
    body: "Championing rigorous learning, research and clinical competence across every allied health discipline.",
  },
  {
    icon: HeartHandshake,
    title: "Collaboration",
    body: "Building bridges between departments, faculty and students to foster a united professional community.",
  },
  {
    icon: Users,
    title: "Student Welfare",
    body: "Advocating for fair stipends, safe hostels and a supportive environment for every member.",
  },
  {
    icon: Globe,
    title: "National Standards",
    body: "Elevating PGIMER allied health professionals to match national healthcare benchmarks.",
  }
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Who we are"
        title="About SAAHS"
        description="The unified voice and academic body representing all allied health professionals in training at PGIMER Chandigarh."
      />

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Target className="size-6" />
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground">Our Mission</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                To unite and empower the allied health student community at PGIMER Chandigarh by fostering academic excellence, advocating for student welfare, and facilitating professional development opportunities that elevate the standard of allied healthcare.
              </p>
            </div>
            <div>
              <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Compass className="size-6" />
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground">Our Vision</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                To establish SAAHS as a premier student association that produces well-rounded, highly skilled, and compassionate allied health professionals who are ready to lead and innovate in the global healthcare ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/20 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Core Values</h2>
            <p className="mt-4 text-lg text-muted-foreground">The principles that guide our association and its members.</p>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((val) => (
              <Card key={val.title} className="bg-card">
                <CardContent className="p-6">
                  <val.icon className="mb-4 size-8 text-brand" />
                  <h3 className="mb-2 font-semibold text-foreground">{val.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{val.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
