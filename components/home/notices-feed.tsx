import Link from "next/link"
import { Pin, ArrowRight, ChevronRight, FileText } from "lucide-react"
import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { NoticeDialog } from "@/components/notices/notice-dialog"
import { Badge } from "@/components/ui/badge"

export async function NoticesFeed() {
  const supabase = await createSupabaseServerClient();
  const { data: notices, error } = await supabase
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  const items = notices || [];

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Important Notices
          </h2>
        </div>
        <Link
          href="/notices"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <ul className="divide-y divide-border">
        {error && (
          <li className="p-4 text-sm text-red-500">Failed to load notices</li>
        )}
        {items.map((n) => (
          <li key={n.id}>
            <NoticeDialog notice={n}>
              <div className="group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-secondary/60">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground group-hover:bg-brand/10 group-hover:text-brand">
                  {n.is_pinned ? <Pin className="size-4" /> : <FileText className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium text-foreground">
                    {n.title}
                  </p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </NoticeDialog>
          </li>
        ))}
        {items.length === 0 && !error && (
          <li className="p-8 text-center text-sm text-muted-foreground">No notices found</li>
        )}
      </ul>
    </div>
  )
}
