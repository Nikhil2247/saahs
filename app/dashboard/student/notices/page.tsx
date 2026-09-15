import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { StudentNoticesClient } from "./student-notices-client";
import type { NoticeDB } from "@/app/dashboard/admin/notices/notices-client";

export const dynamic = "force-dynamic";

export default async function StudentNoticesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: notices, error } = await supabase
    .from("notices")
    .select("id, title, content, category, section, is_pinned, image_url, document_type, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="dashboard-container text-xs text-destructive">
        Failed to load notices: {error.message}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <StudentNoticesClient notices={(notices as NoticeDB[]) || []} />
    </div>
  );
}
