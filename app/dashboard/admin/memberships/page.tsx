import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { MembershipsClient, ProfileDB } from "./memberships-client"

export const dynamic = 'force-dynamic';

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || '1', 10);
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createSupabaseAdminClient();

  const { data: profiles, count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('role', { ascending: true }) // Admins first
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / limit) : 1;

  if (error) {
    return <div className="text-red-500 p-6">Failed to load memberships.</div>
  }

  return (
    <div className="dashboard-container">
      <MembershipsClient 
        profiles={(profiles as ProfileDB[]) || []} 
        page={page} 
        totalPages={totalPages} 
      />
    </div>
  )
}
