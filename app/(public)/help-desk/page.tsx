import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { HelpDeskClient, GrievanceDB } from "./help-desk-client"

export const dynamic = 'force-dynamic';

export default async function HelpDeskPage() {
  const supabase = await createSupabaseServerClient();
  const { data: grievances, error } = await supabase
    .from('grievances')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10); // Show recent 10 for demo

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance">
            <span className="heading-underline heading-underline-brand">Help Desk & Grievances</span>
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Submit grievances and track their status. Your concerns matter to us.
          </p>
        </div>

        {error ? (
          <div className="text-red-500">Failed to load help desk data.</div>
        ) : (
          <HelpDeskClient grievances={grievances as GrievanceDB[]} />
        )}
      </div>
    </div>
  )
}
