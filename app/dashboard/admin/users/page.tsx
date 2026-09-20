import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { UsersClient, UserDB } from "./users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    onboarded?: string;
    dept?: string;
    role?: string;
    batch?: string;
    pageSize?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const {
    page: pageStr,
    search = "",
    onboarded = "all",
    dept = "",
    role: roleFilter = "",
    batch = "",
    pageSize: pageSizeStr = "20",
  } = await searchParams;

  const page = Math.max(1, parseInt(pageStr || "1", 10));
  const pageSize = [10, 20, 50, 100].includes(Number(pageSizeStr))
    ? Number(pageSizeStr)
    : 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, department, course, institution_name, is_pgimer_student, avatar_url, onboarding_complete, membership_status, created_at, batch_year",
      { count: "exact" }
    );

  // Search filter
  if (search.trim()) {
    query = query.or(
      `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,course.ilike.%${search.trim()}%,department.ilike.%${search.trim()}%`
    );
  }

  // Onboarding filter
  if (onboarded === "yes") {
    query = query.eq("onboarding_complete", true);
  } else if (onboarded === "no") {
    query = query.eq("onboarding_complete", false);
  }

  // Department filter
  if (dept.trim()) {
    query = query.ilike("department", `%${dept.trim()}%`);
  }

  // Role filter
  if (roleFilter.trim()) {
    query = query.eq("role", roleFilter.trim());
  }

  // Batch year filter
  if (batch.trim()) {
    query = query.eq("batch_year", batch.trim());
  }

  const { data: users, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  if (error) {
    return <div className="text-red-500 p-6">Failed to load users. {error.message}</div>;
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
        deptFilter={dept}
        roleFilter={roleFilter}
        batchFilter={batch}
        pageSize={pageSize}
      />
    </div>
  );
}
