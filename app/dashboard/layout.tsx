import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, avatar_url")
    .eq("id", session.userId)
    .single();

  const adminRoles = [
    "Executive Body Member",
    "Governing Body Member",
    "Literary Secretary",
    "Treasurer",
    "General Secretary",
    "Vice President",
    "President",
  ];
  const isAdmin = adminRoles.includes(profile?.role ?? "");

  const topbarUser = {
    name: profile?.full_name ?? profile?.email ?? "User",
    email: profile?.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
    role: profile?.role,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar isAdmin={isAdmin} />

      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardTopbar user={topbarUser} isAdmin={isAdmin} />

        <main className="flex-1 overflow-y-auto bg-muted/15 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
