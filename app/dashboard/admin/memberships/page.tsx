import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { MembershipsClient, ProfileDB } from "./memberships-client";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
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
    status = "all",
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

  // Fetch current user's role
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role, department")
    .eq("id", session.userId)
    .single();

  const userRole = currentProfile?.role ?? "";
  const userDept = currentProfile?.department ?? "";

  // Base query — only onboarded users
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("onboarding_complete", true);

  // Faculty can only see students from their own department
  if (userRole === "Faculty" && userDept) {
    query = query.eq("department", userDept);
  }

  // Search filter
  if (search.trim()) {
    query = query.or(
      `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%,course.ilike.%${search.trim()}%,department.ilike.%${search.trim()}%`
    );
  }

  // Status filter
  if (status !== "all") {
    const capitalised = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    query = query.eq("membership_status", capitalised);
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

  const { data: profiles, count, error } = await query
    .order("role", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  if (error) {
    return <div className="text-red-500 p-6">Failed to load memberships.</div>;
  }

  return (
    <div className="dashboard-container">
      <MembershipsClient
        profiles={(profiles as ProfileDB[]) || []}
        page={page}
        totalPages={totalPages}
        search={search}
        status={status}
        totalCount={count ?? 0}
        userRole={userRole}
        deptFilter={dept}
        roleFilter={roleFilter}
        batchFilter={batch}
        pageSize={pageSize}
      />
    </div>
  );
}
