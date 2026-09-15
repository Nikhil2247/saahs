import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { StudentLibraryClient } from "./student-library-client";

export const dynamic = "force-dynamic";

export default async function StudentLibraryPage() {
  const supabase = await createSupabaseServerClient();

  const { data: folders, error } = await supabase
    .from("lib_folders")
    .select("*")
    .order("course", { ascending: true })
    .order("semester", { ascending: true });

  if (error) {
    return (
      <div className="dashboard-container text-xs text-destructive">
        Failed to load library: {error.message}
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <StudentLibraryClient initialFolders={(folders as any[]) || []} />
    </div>
  );
}
