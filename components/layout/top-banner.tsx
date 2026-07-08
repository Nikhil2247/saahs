import Link from "next/link"
import { Megaphone, LogIn } from "lucide-react"
import { createSupabaseServerClient } from "@/src/lib/supabase/server"

export async function TopBanner() {
  const supabase = await createSupabaseServerClient();
  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, is_pinned')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  const rawItems = notices || [];
  const items = rawItems.length > 0 ? [...rawItems, ...rawItems] : [];

  return (
    <div className="w-full border-b border-primary/20 bg-primary text-primary-foreground">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-4 px-4">
        <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
          <Megaphone className="size-3.5 text-brand" />
          <span className="hidden sm:inline">Latest Notice</span>
        </div>

        <div className="ticker-track relative flex-1 overflow-hidden">
          <div className="animate-ticker flex w-max items-center gap-10 whitespace-nowrap">
            {items.map((n, i) => (
              <Link
                key={`${n.id}-${i}`}
                href="/notices"
                className="text-xs text-primary-foreground/85 transition-colors hover:text-primary-foreground"
              >
                <span className="mr-2 text-brand">•</span>
                {n.title}
              </Link>
            ))}
            {items.length === 0 && (
              <span className="text-xs text-primary-foreground/70">No active notices.</span>
            )}
          </div>
        </div>

        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary-foreground/10 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-primary-foreground/20"
        >
          <LogIn className="size-3.5" />
          <span className="hidden xs:inline sm:inline">Portal Login</span>
        </Link>
      </div>
    </div>
  )
}
