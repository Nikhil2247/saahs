import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { Calendar, MapPin, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export async function UpcomingEvents() {
  const supabase = await createSupabaseServerClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .gte('schedule', new Date().toISOString())
    .order('schedule', { ascending: true })
    .limit(3);

  const upcomingEvents = events || [];

  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Upcoming <span className="text-brand">Events</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              Workshops, seminars and community gatherings
            </p>
          </div>
        </div>

        {error ? (
          <div className="text-red-500 py-8 text-center">Failed to load upcoming events</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            No upcoming events scheduled at the moment.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {event.banner_url ? (
                    <img 
                      src={event.banner_url} 
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary/50">
                      <Calendar className="size-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3">
                    <Badge className="bg-brand text-brand-foreground border-none">
                      {event.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold text-foreground line-clamp-2">
                    {event.title}
                  </h3>
                  
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Calendar className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span>
                        {new Date(event.schedule).toLocaleDateString(undefined, { 
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Clock className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span>
                        {new Date(event.schedule).toLocaleTimeString(undefined, { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
