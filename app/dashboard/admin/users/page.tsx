import { createSupabaseAdminClient } from "@/src/lib/supabase/admin"
import { UsersClient, UserDB } from "./users-client"

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; onboarded?: string }>
}) {
  const { page: pageStr, search = '', onboarded = 'all' } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || '1', 10));
  const limit = 15;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, department, course, institution_name, is_pgimer_student, avatar_url, onboarding_complete, membership_status, created_at', { count: 'exact' });

  // Server-side search filter
  if (search.trim()) {
    query = query.or(
      `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,course.ilike.%${search.trim()}%,department.ilike.%${search.trim()}%`
    );
  }

  // Server-side onboarding filter
  if (onboarded === 'yes') {
    query = query.eq('onboarding_complete', true);
  } else if (onboarded === 'no') {
    query = query.eq('onboarding_complete', false);
  }

  const { data: users, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / limit) : 1;

  if (error) {
    return <div className="text-red-500 p-6">Failed to load users. {error.message}</div>
  }

  return (
    <div className="dashboard-container">
      <UsersClient
        users={(users as UserDB[]) || []}
        page={page}
        totalPages={totalPages}
        search={search}
        onboarded={onboarded}
        totalCount={count ?? 0}
      />
    </div>
  )
}
