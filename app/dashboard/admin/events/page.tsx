import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { EventsClient, EventDB } from "./events-client"

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || '1', 10);
  const limit = 10;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = await createSupabaseServerClient();
  
  const { data: events, count, error } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .order('schedule', { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / limit) : 1;

  if (error) {
    return <div className="text-red-500 p-6">Failed to load events. Error: {error.message}</div>
  }

  const mappedEvents: EventDB[] = (events || []).map((ev: any) => ({
    id: ev.id.toString(),
    title: ev.title,
    description: ev.description,
    event_type: ev.category,
    start_time: ev.schedule,
    end_time: ev.schedule,
    location: ev.venue,
    image_url: ev.banner_url,
    created_at: ev.created_at,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <EventsClient 
        events={mappedEvents} 
        page={page} 
        totalPages={totalPages} 
      />
    </div>
  )
}
