import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { LibraryClient, LibraryDB } from "./library-client"

export const dynamic = 'force-dynamic';

export default async function AdminLibraryPage({
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
  
  const { data: resources, count, error } = await supabase
    .from('library_resources')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / limit) : 1;

  if (error) {
    return <div className="text-red-500 p-6">Failed to load library resources. Error: {error.message}</div>
  }

  const mappedResources: LibraryDB[] = (resources || []).map((r: any) => ({
    id: r.id.toString(),
    title: r.title,
    resource_type: r.category === 'Books' ? 'E-Book' : r.category === 'Previous Year Papers' ? 'Past Paper' : r.category === 'Presentations' ? 'Presentation' : r.category,
    department: null,
    subject: null,
    file_url: r.file_url,
    created_at: r.created_at,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <LibraryClient 
        resources={mappedResources} 
        page={page} 
        totalPages={totalPages} 
      />
    </div>
  )
}
