import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { NoticesClient, NoticeDB } from "./notices-client"

export const dynamic = 'force-dynamic';

export default async function AdminNoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || '1', 10);
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createSupabaseServerClient();
  
  const { data: notices, count, error } = await supabase
    .from('notices')
    .select('*', { count: 'exact' })
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / limit) : 1;

  if (error) {
    return <div className="text-red-500 p-6">Failed to load notices.</div>
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <NoticesClient 
        notices={(notices as NoticeDB[]) || []} 
        page={page} 
        totalPages={totalPages} 
      />
    </div>
  )
}
