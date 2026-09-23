import Link from "next/link"
import { createSupabaseServerClient } from "@/src/lib/supabase/server"
import { getSession } from "@/lib/auth/session"
import { Calendar, MapPin, Clock, Trophy, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export async function UpcomingEvents() {
  let upcomingEvents: any[] = []
  let hasError = false
  let isLoggedIn = false

  try {
    const [supabase, session] = await Promise.all([
      createSupabaseServerClient(),
      getSession(),
    ])
    isLoggedIn = !!session

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('schedule', new Date().toISOString())
      .order('schedule', { ascending: true })
      .limit(3)

    if (error) {
      hasError = true
    } else if (data && data.length > 0) {
      upcomingEvents = data
    }
  } catch {
    hasError = false
  }

  // Where clicking an event card takes the user
  const registerHref = isLoggedIn ? "/dashboard/student/events" : "/login"

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
          <Link
            href={registerHref}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {hasError ? (
          <div className="text-red-500 py-8 text-center">Failed to load upcoming events</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            No upcoming events scheduled at the moment.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => {
              const isSports = event.category === "Sports"
              return (
                <Link
                  key={event.id}
                  href={registerHref}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-xl hover:border-brand/40 hover:-translate-y-0.5 duration-200"
                >
                  {/* Banner */}
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

                    {/* Category badge */}
                    <div className="absolute right-3 top-3">
                      <Badge
                        className={`border-none text-xs font-semibold shadow ${
                          isSports
                            ? "bg-amber-500 text-white"
                            : "bg-brand text-brand-foreground"
                        }`}
                      >
                        {isSports && <Trophy className="size-3 mr-1" />}
                        {event.category}
                      </Badge>
                    </div>

                    {/* Sports: Register overlay on hover */}
                    {isSports && (
                      <div className="absolute inset-0 bg-amber-900/0 group-hover:bg-amber-900/40 transition-all duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5">
                          <Trophy className="size-3.5" />
                          {isLoggedIn ? "Register Now" : "Login to Register"}
                        </span>
                      </div>
                    )}

                    {/* Non-sports: subtle view overlay */}
                    {!isSports && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 text-foreground text-xs font-bold px-4 py-2 rounded-full shadow">
                          {isLoggedIn ? "View & Register" : "Login to Register"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-brand transition-colors">
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

                    {/* CTA */}
                    <div className="mt-4 pt-4 border-t border-border/60">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          isSports ? "text-amber-600" : "text-brand"
                        }`}
                      >
                        {isLoggedIn ? (
                          isSports ? (
                            <><Trophy className="size-3.5" /> Register for Sports Festival <ArrowRight className="size-3" /></>
                          ) : (
                            <>View &amp; Register <ArrowRight className="size-3" /></>
                          )
                        ) : (
                          <>Login to register <ArrowRight className="size-3" /></>
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Mobile: view all link */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href={registerHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            View all events <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
