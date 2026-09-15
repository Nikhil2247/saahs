import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { LibraryClient } from "./library-client"

export const dynamic = 'force-dynamic';

export default async function AdminLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || '1', 10);
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createSupabaseAdminClient();

  // Fetch resources (passed as initial data; the client also fetches folder-specific resources on demand)
  const { data: resources, count, error } = await supabase
    .from('library_resources')
    .select('id, title, category, file_url, file_size_bytes, mime_type, folder_id, course, semester, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / limit) : 1;

  if (error) {
    return <div className="text-red-500 p-6">Failed to load library resources. Error: {error.message}</div>
  }

  return (
    <div className="dashboard-container">
      <LibraryClient
        resources={(resources || []) as any[]}
        page={page}
        totalPages={totalPages}
      />
    </div>
  )
}
