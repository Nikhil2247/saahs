import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { PageHeader } from "@/components/page-header"
import { LibraryBrowser } from "./library-browser"
import { ShieldAlert, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = 'force-dynamic';

export default async function ELibraryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <PageHeader
          eyebrow="Knowledge Repository"
          title="SAAHS E-Library"
          description="A curated collection of peer-reviewed study material, previous year papers, standard operating procedures and clinical guidelines."
        />
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <div className="mx-auto max-w-md border rounded-xl p-8 bg-card shadow-sm space-y-4">
            <LogIn className="size-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-sm text-muted-foreground">
              Please sign in to access the SAAHS e-library resources.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Get user profile role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = [
    'SAAHS Member', 'Executive Body Member', 'Governing Body Member',
    'Literary Secretary', 'Treasurer', 'General Secretary',
    'Vice President', 'President'
  ];

  if (!profile || !allowedRoles.includes(profile.role)) {
    return (
      <div>
        <PageHeader
          eyebrow="Knowledge Repository"
          title="SAAHS E-Library"
          description="A curated collection of peer-reviewed study material, previous year papers, standard operating procedures and clinical guidelines."
        />
        <div className="mx-auto max-w-6xl px-4 py-12 text-center">
          <div className="mx-auto max-w-md border border-yellow-500/30 rounded-xl p-8 bg-yellow-500/5 shadow-sm space-y-4">
            <ShieldAlert className="size-12 text-yellow-600 mx-auto" />
            <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-500">Membership Required</h2>
            <p className="text-sm text-muted-foreground text-pretty">
              Your membership application is currently pending approval. Access to the e-library is granted to approved SAAHS members.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fetch library resources
  const { data: resources } = await supabase
    .from('library_resources')
    .select('*')
    .order('created_at', { ascending: false });

  // Map to the formats used by LibraryBrowser
  const mappedResources = (resources || []).map((r: any) => {
    let displayType = 'Notes';
    if (r.category === 'Previous Year Papers') displayType = 'Previous Papers';
    else if (r.category === 'SOPs') displayType = 'SOP';
    else if (r.category === 'Guidelines' || r.category === 'Research Papers') displayType = 'Guideline';
    
    return {
      id: r.id.toString(),
      title: r.title,
      type: displayType,
      department: 'General',
      format: r.mime_type ? r.mime_type.split('/')[1]?.toUpperCase() || 'PDF' : 'PDF',
      size: r.file_size_bytes ? `${(r.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB',
      updated: r.created_at,
      file_url: r.file_url
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge Repository"
        title="SAAHS E-Library"
        description="A curated collection of peer-reviewed study material, previous year papers, standard operating procedures and clinical guidelines."
      />
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <LibraryBrowser resources={mappedResources} />
      </div>
    </div>
  )
}
