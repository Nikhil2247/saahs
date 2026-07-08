import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { NoticesClient, NoticeDB } from "./notices-client"

export const dynamic = 'force-dynamic';

export default async function NoticesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: notices, error } = await supabase
    .from('notices')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance">
            <span className="heading-underline heading-underline-brand">Notices & Announcements</span>
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Stay updated with important announcements from SAAHS
          </p>
        </div>

        {error ? (
          <div className="text-red-500">Failed to load notices.</div>
        ) : (
          <NoticesClient notices={notices as NoticeDB[]} />
        )}
      </div>
    </div>
  )
}
