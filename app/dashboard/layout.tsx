import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs: Array<{ name: string; value: string; options?: CookieOptions }>) => {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* ignored */ }
        },
      },
    }
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
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
    name: profile?.full_name ?? user.email ?? "User",
    email: user.email ?? "",
    avatarUrl: profile?.avatar_url ?? null,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar isAdmin={isAdmin} />
      
      <div className="flex flex-1 flex-col lg:pl-64">
        <DashboardTopbar user={topbarUser} />
        
        <main className="flex-1 overflow-y-auto bg-muted/20">
          {children}
        </main>
      </div>
    </div>
  );
}
