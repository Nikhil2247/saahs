import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"
import { DepartmentsGrid } from "./departments-grid"

export const metadata: Metadata = {
  title: "Departments | SAAHS",
  description:
    "Explore the 13 allied health science departments represented by SAAHS at PGIMER Chandigarh.",
}

export default function DepartmentsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Member Departments"
        title="Allied Health Disciplines"
        description="SAAHS represents thirteen specialized departments, each advancing a distinct field of allied health practice and education."
      />
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <DepartmentsGrid />
      </div>
    </div>
  )
}
