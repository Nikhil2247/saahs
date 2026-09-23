"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registerForEvent, cancelEventRegistration } from "@/app/actions/events"
import { SOLO_SPORTS, TEAM_SPORTS } from "@/lib/sports-constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Calendar,
  MapPin,
  Clock,
  Trophy,
  ArrowRight,
  AlertTriangle,
  User,
  BookOpen,
  GraduationCap,
  X,
  Users,
  Zap,
  CheckCircle2,
  Info,
} from "lucide-react"
import { toast } from "sonner"

interface EventItem {
  id: number
  title: string
  description: string
  category: string
  banner_url: string | null
  schedule: string
  venue: string
  organizer_info?: string | null
}

interface ProfileSnippet {
  full_name: string | null
  department: string | null
  course: string | null
  batch_year: string | null
}

interface Props {
  events: EventItem[]
  isLoggedIn: boolean
  profile: ProfileSnippet
  registeredEventIds: number[]
}

export function UpcomingEventsClient({
  events,
  isLoggedIn,
  profile,
  registeredEventIds,
}: Props) {
  const router = useRouter()
  const [registeredIds, setRegisteredIds] = useState<Set<number>>(
    new Set(registeredEventIds)
  )

  // Details dialog
  const [detailsEvent, setDetailsEvent] = useState<EventItem | null>(null)

  // Sports registration dialog
  const [sportsEvent, setSportsEvent] = useState<EventItem | null>(null)
  const [selectedSoloSports, setSelectedSoloSports] = useState<string[]>([])
  const [selectedTeamSports, setSelectedTeamSports] = useState<string[]>([])
  const [waiverAccepted, setWaiverAccepted] = useState(false)
  const [waiverExpanded, setWaiverExpanded] = useState(false)

  const [isPending, startTransition] = useTransition()

  const allSelectedSports = [...selectedSoloSports, ...selectedTeamSports]

  const openSportsDialog = (event: EventItem) => {
    router.push("/sports")
  }

  const toggleSolo = (s: string) =>
    setSelectedSoloSports((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
  const toggleTeam = (s: string) =>
    setSelectedTeamSports((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))

  const handleSportsRegister = () => {
    if (!sportsEvent) return
    startTransition(async () => {
      const result = await registerForEvent(sportsEvent.id, {
        sportChoices: allSelectedSports,
        waiverAccepted,
        isSportsEvent: true,
      })
      if (result.success) {
        setRegisteredIds((prev) => new Set([...prev, sportsEvent.id]))
        toast.success("🏆 Registration Successful!", {
          description: `Registered for: ${allSelectedSports.join(", ")}`,
        })
        setSportsEvent(null)
      } else {
        toast.error(result.error || "Registration failed")
      }
    })
  }

  const handleCancel = (eventId: number) => {
    startTransition(async () => {
      const result = await cancelEventRegistration(eventId)
      if (result.success) {
        setRegisteredIds((prev) => {
          const next = new Set(prev)
          next.delete(eventId)
          return next
        })
        toast.info("Registration cancelled.")
      } else {
        toast.error(result.error || "Failed to cancel")
      }
    })
  }

  if (events.length === 0) {
    return (
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            Upcoming <span className="text-brand">Events</span>
          </h2>
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            No upcoming events scheduled at the moment.
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-16">
        {/* Section header */}
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
            href={isLoggedIn ? "/dashboard/student/events" : "/login"}
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {/* Event cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const isSports = event.category === "Sports"
            const isRegistered = registeredIds.has(event.id)

            return (
              <div
                key={event.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all duration-200 hover:shadow-xl hover:border-brand/40 hover:-translate-y-0.5 cursor-pointer"
                onClick={() => {
                  if (isSports && !isRegistered) openSportsDialog(event)
                  else setDetailsEvent(event)
                }}
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
                  <div className="absolute left-3 top-3">
                    <Badge
                      className={`border-none text-xs font-semibold shadow ${
                        isSports
                          ? "bg-brand text-brand-foreground"
                          : "bg-brand text-brand-foreground"
                      }`}
                    >
                      {isSports && <Trophy className="size-3 mr-1" />}
                      {event.category}
                    </Badge>
                  </div>

                  {/* Registered badge */}
                  {isRegistered && (
                    <div className="absolute right-3 top-3 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Registered
                    </div>
                  )}

                  {/* Hover CTA overlay */}
                  {!isRegistered && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                      <span
                        className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 ${
                          isSports
                            ? "bg-brand text-brand-foreground"
                            : "bg-white/90 text-foreground"
                        }`}
                      >
                        {isSports ? (
                          <><Trophy className="size-3.5" /> {isLoggedIn ? "Register Now" : "Login to Register"}</>
                        ) : (
                          <>{isLoggedIn ? "View Details" : "View Details"}</>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-base font-bold text-foreground line-clamp-2 group-hover:text-brand transition-colors">
                    {event.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <Clock className="size-4 shrink-0 text-brand" />
                      <span>
                        {new Date(event.schedule).toLocaleDateString(undefined, {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })}{" · "}
                        {new Date(event.schedule).toLocaleTimeString(undefined, {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                      <MapPin className="size-4 shrink-0 text-brand" />
                      <span className="line-clamp-1">{event.venue}</span>
                    </div>
                  </div>

                  {/* Action row */}
                  <div
                    className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-2"
                    onClick={(ev) => ev.stopPropagation()}
                  >
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setDetailsEvent(event)}
                    >
                      <Info className="size-3.5" /> Details
                    </button>

                    {isRegistered ? (
                      <button
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-rose-600 transition-colors"
                        onClick={() => handleCancel(event.id)}
                        disabled={isPending}
                      >
                        <CheckCircle2 className="size-3.5" /> Registered
                      </button>
                    ) : isSports ? (
                      <Button
                        size="sm"
                        className="h-7 text-xs px-3 bg-brand hover:bg-brand/90 text-brand-foreground font-semibold"
                        asChild
                      >
                        <Link href="/sports">
                          <Trophy className="mr-1 size-3" /> Register
                        </Link>
                      </Button>
                    ) : (
                      <button
                        className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                        onClick={() => setDetailsEvent(event)}
                      >
                        Learn more <ArrowRight className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile view all */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href={isLoggedIn ? "/dashboard/student/events" : "/login"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            View all events <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Details Dialog ────────────────────────────────────────── */}
      <Dialog open={!!detailsEvent} onOpenChange={(open) => !open && setDetailsEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 mb-1">
              {detailsEvent?.category}
            </Badge>
            <DialogTitle className="text-base font-bold">{detailsEvent?.title}</DialogTitle>
          </DialogHeader>
          {detailsEvent?.banner_url && (
            <div className="overflow-hidden rounded-md border border-border max-h-48">
              <img src={detailsEvent.banner_url} alt={detailsEvent.title} className="w-full h-48 object-cover" />
            </div>
          )}
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/30 p-2.5 border border-border">
              <div>
                <span className="text-muted-foreground block text-[10px]">Date &amp; Time</span>
                <span className="font-semibold text-foreground">
                  {detailsEvent?.schedule && new Date(detailsEvent.schedule).toLocaleString(undefined, {
                    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Venue</span>
                <span className="font-semibold text-foreground">{detailsEvent?.venue}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">About</span>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{detailsEvent?.description}</p>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDetailsEvent(null)}>Close</Button>
            {detailsEvent?.category === "Sports" && !registeredIds.has(detailsEvent.id) && (
              <Button
                size="sm"
                className="bg-brand hover:bg-brand/90 text-brand-foreground"
                onClick={() => { setDetailsEvent(null); openSportsDialog(detailsEvent) }}
              >
                <Trophy className="mr-1 size-3.5" /> Register Now
              </Button>
            )}
            {!isLoggedIn && (
              <Button size="sm" asChild>
                <Link href="/login">Login to Register</Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sports Registration Dialog ────────────────────────────── */}
      <Dialog open={!!sportsEvent} onOpenChange={(open) => !open && setSportsEvent(null)}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex size-9 items-center justify-center rounded-xl bg-brand/15 border border-brand/30">
                <Trophy className="size-5 text-brand" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold leading-tight">
                  Sports Festival Registration
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">{sportsEvent?.title}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Profile (read-only) */}
            <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
              <div className="px-3.5 py-2 bg-muted/40 border-b border-border">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Your Details</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Auto-filled from your profile</p>
              </div>
              <div className="p-3.5 space-y-3">
                {[
                  { icon: User, label: "Name", value: profile.full_name },
                  { icon: BookOpen, label: "Department", value: profile.department ?? profile.course },
                  { icon: GraduationCap, label: "Year / Semester", value: profile.batch_year ? `Batch ${profile.batch_year}` : null },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Icon className="size-3 text-primary" /> {label}
                      <span className="text-destructive">*</span>
                    </label>
                    <div className="h-8 rounded-md border border-border bg-muted/50 px-3 flex items-center text-xs text-foreground font-medium">
                      {value ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Solo Games */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-b border-border flex items-center gap-2">
                <Zap className="size-3.5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">Solo games</p>
                  <p className="text-[10px] text-muted-foreground">Select any solo events you wish to participate in</p>
                </div>
              </div>
              <div className="p-3.5 grid grid-cols-1 gap-1.5">
                {SOLO_SPORTS.map((sport) => {
                  const checked = selectedSoloSports.includes(sport)
                  return (
                    <label
                      key={sport}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all text-xs ${
                        checked
                          ? "border-blue-400 bg-blue-500/8 text-blue-800 dark:text-blue-300"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30 text-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSolo(sport)}
                        className={checked ? "border-blue-500 bg-blue-500" : ""}
                      />
                      <span className={checked ? "font-medium" : ""}>{sport}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Team Games */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-brand/5 to-brand/10 border-b border-border flex items-center gap-2">
                <Users className="size-3.5 text-brand shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">TEAM games</p>
                  <p className="text-[10px] text-muted-foreground">Select any team events you wish to participate in</p>
                </div>
              </div>
              <div className="p-3.5 grid grid-cols-1 gap-1.5">
                {TEAM_SPORTS.map((sport) => {
                  const checked = selectedTeamSports.includes(sport)
                  return (
                    <label
                      key={sport}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all text-xs ${
                        checked
                          ? "border-brand/60 bg-brand/8 text-brand"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30 text-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleTeam(sport)}
                        className={checked ? "border-brand bg-brand" : ""}
                      />
                      <span className={checked ? "font-medium" : ""}>{sport}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Selected summary chips */}
            {allSelectedSports.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                  Selected ({allSelectedSports.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {allSelectedSports.map((s) => (
                    <Badge
                      key={s}
                      className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                      onClick={() => SOLO_SPORTS.includes(s as any) ? toggleSolo(s) : toggleTeam(s)}
                    >
                      {s} <X className="size-2.5" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Liability Waiver */}
            <div className="rounded-xl border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setWaiverExpanded((v) => !v)}
                className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    Terms &amp; Conditions / Liability Waiver
                  </span>
                  <span className="text-destructive text-xs">*</span>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                  {waiverExpanded ? "Collapse ▲" : "Read ▼"}
                </span>
              </button>
              {waiverExpanded && (
                <div className="p-3.5 border-t border-border text-[11px] text-muted-foreground leading-relaxed space-y-1.5 max-h-44 overflow-y-auto">
                  <p className="font-semibold text-foreground text-xs">
                    SAAHS Sports Festival 2026 — Liability Waiver &amp; Terms
                  </p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>I voluntarily participate and understand the inherent risks of physical injury.</li>
                    <li>I confirm I am medically fit to participate in the selected sports.</li>
                    <li>I agree to abide by all rules set by the SAAHS Sports Committee.</li>
                    <li>SAAHS and affiliated institutions will not be liable for any injury, loss, or damage.</li>
                    <li>I consent to photographs/videos being used for SAAHS promotional purposes.</li>
                    <li>I agree to maintain sportsmanship and follow the code of conduct throughout.</li>
                  </ol>
                </div>
              )}
              <div className="flex items-start gap-2.5 p-3.5 border-t border-border bg-card">
                <Checkbox
                  id="home-waiver"
                  checked={waiverAccepted}
                  onCheckedChange={(v) => setWaiverAccepted(!!v)}
                  className="mt-0.5"
                />
                <label htmlFor="home-waiver" className="text-xs text-foreground cursor-pointer leading-snug">
                  I have read and agree to the Terms &amp; Conditions and Liability Waiver. I participate at my own risk.
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSportsEvent(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending || allSelectedSports.length === 0 || !waiverAccepted}
              className="bg-brand hover:bg-brand/90 text-brand-foreground font-semibold min-w-[140px]"
              onClick={handleSportsRegister}
            >
              {isPending ? "Submitting..." : (
                <><Trophy className="mr-1.5 size-3.5" /> Confirm Registration</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
