"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerForEvent, cancelEventRegistration } from "@/app/actions/events";
import { SOLO_SPORTS, TEAM_SPORTS } from "@/lib/sports-constants";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  Info,
  Trophy,
  AlertTriangle,
  User,
  BookOpen,
  GraduationCap,
  X,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { EventRow } from "@/types/database";

interface ProfileSnippet {
  full_name: string | null;
  phone_number: string | null;
  department: string | null;
  course: string | null;
  batch_year: string | null;
  roll_number: string | null;
}

export function StudentEventsClient({
  events,
  registeredEventIds,
  profile,
}: {
  events: EventRow[];
  registeredEventIds: number[];
  profile: ProfileSnippet;
}) {
  const router = useRouter();
  const [registeredIds, setRegisteredIds] = useState<Set<number>>(
    new Set(registeredEventIds)
  );
  const [activeTab, setActiveTab] = useState<string>("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);

  // Sports registration dialog state
  const [sportsDialogEvent, setSportsDialogEvent] = useState<EventRow | null>(null);
  const [selectedSoloSports, setSelectedSoloSports] = useState<string[]>([]);
  const [selectedTeamSports, setSelectedTeamSports] = useState<string[]>([]);
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverExpanded, setWaiverExpanded] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [isCancelling, startCancelTransition] = useTransition();

  const now = new Date().toISOString();

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const isPast = e.past_archive || e.schedule < now;
      const matchesTab = activeTab === "upcoming" ? !isPast : isPast;
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [events, activeTab, searchQuery, now]);

  const openSportsDialog = (event: EventRow) => {
    router.push("/sports");
  };

  const toggleSoloSport = (sport: string) =>
    setSelectedSoloSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );

  const toggleTeamSport = (sport: string) =>
    setSelectedTeamSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );

  const allSelectedSports = [...selectedSoloSports, ...selectedTeamSports];

  const handleSportsRegister = () => {
    if (!sportsDialogEvent) return;
    startTransition(async () => {
      const result = await registerForEvent(sportsDialogEvent.id, {
        sportChoices: allSelectedSports,
        waiverAccepted,
        isSportsEvent: true,
      });
      if (result.success) {
        setRegisteredIds((prev) => new Set([...prev, sportsDialogEvent.id]));
        toast.success("🏆 Registration Successful!", {
          description: `Registered for: ${allSelectedSports.join(", ")}`,
        });
        setSportsDialogEvent(null);
      } else {
        toast.error(result.error || "Registration failed");
      }
    });
  };

  const handleRegularRegister = (eventId: number) => {
    startTransition(async () => {
      const result = await registerForEvent(eventId, {
        isSportsEvent: false,
        waiverAccepted: true,
      });
      if (result.success) {
        setRegisteredIds((prev) => new Set([...prev, eventId]));
        toast.success("Successfully registered for event!");
      } else {
        toast.error(result.error || "Failed to register");
      }
    });
  };

  const handleCancel = (eventId: number) => {
    startCancelTransition(async () => {
      const result = await cancelEventRegistration(eventId);
      if (result.success) {
        setRegisteredIds((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        toast.info("Registration cancelled.");
      } else {
        toast.error(result.error || "Failed to cancel registration");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            <span>Events &amp; Academic Workshops</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Conferences, symposia, sports meets, and cultural festivals hosted by SAAHS.
          </p>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2.5 rounded-lg border border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-8 p-0.5">
            <TabsTrigger value="upcoming" className="text-xs px-3 h-7">
              Upcoming Events
            </TabsTrigger>
            <TabsTrigger value="past" className="text-xs px-3 h-7">
              Past Archives
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search events or venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-muted-foreground border rounded-lg border-border bg-card">
            No events found.
          </div>
        ) : (
          filteredEvents.map((e) => {
            const isRegistered = registeredIds.has(e.id);
            const isSports = e.category === "Sports";
            const isPast = e.past_archive || e.schedule < now;

            return (
              <Card
                key={e.id}
                onClick={() => {
                  if (isSports && !isRegistered && !isPast) {
                    openSportsDialog(e);
                  } else {
                    setSelectedEvent(e);
                  }
                }}
                className="overflow-hidden border-border shadow-2xs hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {e.banner_url ? (
                    <div className="h-36 w-full overflow-hidden bg-muted/40 relative">
                      <img
                        src={e.banner_url}
                        alt={e.title}
                        className="h-full w-full object-cover"
                      />
                      <Badge
                        className={`absolute top-2 left-2 text-[10px] px-1.5 py-0 backdrop-blur-sm border ${
                          isSports
                            ? "bg-amber-500/90 text-white border-amber-400"
                            : "bg-background/90 text-foreground border-border"
                        }`}
                      >
                        {e.category}
                      </Badge>
                      {isRegistered && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle2 className="size-2.5" /> Registered
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`h-14 w-full flex items-center justify-center ${
                        isSports
                          ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10"
                          : "bg-gradient-to-br from-primary/5 to-primary/10"
                      }`}
                    >
                      {isSports ? (
                        <Trophy className="size-7 text-amber-500/60" />
                      ) : (
                        <Calendar className="size-7 text-primary/40" />
                      )}
                    </div>
                  )}

                  <div className="p-3.5 space-y-2">
                    {!e.banner_url && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 mb-1 ${
                          isSports
                            ? "bg-amber-500/10 text-amber-700 border-amber-300"
                            : ""
                        }`}
                      >
                        {e.category}
                      </Badge>
                    )}
                    <h3 className="text-sm font-bold text-foreground line-clamp-1 leading-snug">
                      {e.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {e.description}
                    </p>
                    <div className="space-y-1 pt-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-primary shrink-0" />
                        <span>
                          {new Date(e.schedule).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-primary shrink-0" />
                        <span className="truncate">{e.venue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 pt-0 border-t border-border/50 mt-2 flex items-center justify-between gap-2" onClick={(ev) => ev.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs px-2"
                    onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                  >
                    <Info className="mr-1 size-3" /> Details
                  </Button>

                  {!isPast && (
                    isRegistered ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isCancelling}
                        className="h-7 text-xs px-2.5 font-medium border-emerald-300 text-emerald-700 bg-emerald-500/5 hover:bg-rose-500/10 hover:border-rose-300 hover:text-rose-700 transition-colors"
                        onClick={(ev) => { ev.stopPropagation(); handleCancel(e.id); }}
                      >
                        <CheckCircle2 className="mr-1 size-3 text-emerald-600" />
                        Registered
                      </Button>
                    ) : isSports ? (
                      <Button
                        size="sm"
                        asChild
                        className="h-7 text-xs px-2.5 font-semibold bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        <Link href="/sports">
                          <Trophy className="mr-1 size-3" /> Register
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isPending}
                        className="h-7 text-xs px-2.5 font-medium"
                        onClick={(ev) => { ev.stopPropagation(); handleRegularRegister(e.id); }}
                      >
                        Register
                      </Button>
                    )
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Event Details Dialog ──────────────────────────────────────── */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 mb-1">
              {selectedEvent?.category}
            </Badge>
            <DialogTitle className="text-base font-bold text-foreground">
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent?.banner_url && (
            <div className="overflow-hidden rounded-md border border-border max-h-48">
              <img src={selectedEvent.banner_url} alt={selectedEvent.title} className="w-full h-48 object-cover" />
            </div>
          )}
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/30 p-2.5 border border-border">
              <div>
                <span className="text-muted-foreground block text-[10px]">Date &amp; Time</span>
                <span className="font-semibold text-foreground">
                  {selectedEvent?.schedule && new Date(selectedEvent.schedule).toLocaleString(undefined, {
                    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Venue</span>
                <span className="font-semibold text-foreground truncate block">{selectedEvent?.venue}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Description</span>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{selectedEvent?.description}</p>
            </div>
            {selectedEvent?.organizer_info && (
              <div className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Organizer: </span>
                {selectedEvent.organizer_info}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setSelectedEvent(null)}>Close</Button>
            {selectedEvent && !registeredIds.has(selectedEvent.id) && selectedEvent.schedule > now && !selectedEvent.past_archive && (
              <Button
                size="sm"
                className={selectedEvent.category === "Sports" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                onClick={() => {
                  setSelectedEvent(null);
                  if (selectedEvent.category === "Sports") openSportsDialog(selectedEvent);
                  else handleRegularRegister(selectedEvent.id);
                }}
              >
                {selectedEvent.category === "Sports" ? (
                  <><Trophy className="mr-1 size-3" /> Register Now</>
                ) : "Register Now"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sports Registration Dialog ────────────────────────────────── */}
      <Dialog open={!!sportsDialogEvent} onOpenChange={(open) => !open && setSportsDialogEvent(null)}>
        <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-300/50">
                <Trophy className="size-5 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold leading-tight">
                  Sports Festival Registration
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {sportsDialogEvent?.title}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-1">

            {/* ── Section 1: Profile Details (read-only) ── */}
            <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
              <div className="px-3.5 py-2 bg-muted/40 border-b border-border">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Your Details
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Auto-filled from your profile</p>
              </div>
              <div className="p-3.5 space-y-3">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <User className="size-3 text-primary" /> Name
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="h-8 rounded-md border border-border bg-muted/50 px-3 flex items-center text-xs text-foreground font-medium">
                    {profile.full_name ?? "—"}
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <BookOpen className="size-3 text-primary" /> Department
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="h-8 rounded-md border border-border bg-muted/50 px-3 flex items-center text-xs text-foreground font-medium">
                    {profile.department ?? profile.course ?? "—"}
                  </div>
                </div>

                {/* Year / Semester */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <GraduationCap className="size-3 text-primary" /> Year / Semester
                    <span className="text-destructive">*</span>
                  </label>
                  <div className="h-8 rounded-md border border-border bg-muted/50 px-3 flex items-center text-xs text-foreground font-medium">
                    {profile.batch_year ? `Batch ${profile.batch_year}` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: Solo Games ── */}
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
                  const checked = selectedSoloSports.includes(sport);
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
                        onCheckedChange={() => toggleSoloSport(sport)}
                        className={checked ? "border-blue-500 bg-blue-500" : ""}
                      />
                      <span className={checked ? "font-medium" : ""}>{sport}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Section 3: Team Games ── */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-b border-border flex items-center gap-2">
                <Users className="size-3.5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">TEAM games</p>
                  <p className="text-[10px] text-muted-foreground">Select any team events you wish to participate in</p>
                </div>
              </div>
              <div className="p-3.5 grid grid-cols-1 gap-1.5">
                {TEAM_SPORTS.map((sport) => {
                  const checked = selectedTeamSports.includes(sport);
                  return (
                    <label
                      key={sport}
                      className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all text-xs ${
                        checked
                          ? "border-amber-400 bg-amber-500/8 text-amber-800 dark:text-amber-300"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30 text-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleTeamSport(sport)}
                        className={checked ? "border-amber-500 bg-amber-500" : ""}
                      />
                      <span className={checked ? "font-medium" : ""}>{sport}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Selected summary */}
            {allSelectedSports.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                  Selected Events ({allSelectedSports.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {allSelectedSports.map((s) => (
                    <Badge
                      key={s}
                      className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20 flex items-center gap-1 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                      onClick={() => {
                        if (SOLO_SPORTS.includes(s as any)) toggleSoloSport(s);
                        else toggleTeamSport(s);
                      }}
                    >
                      {s}
                      <X className="size-2.5" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* ── Liability Waiver ── */}
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
                  id="waiver-checkbox"
                  checked={waiverAccepted}
                  onCheckedChange={(v) => setWaiverAccepted(!!v)}
                  className="mt-0.5"
                />
                <label htmlFor="waiver-checkbox" className="text-xs text-foreground cursor-pointer leading-snug">
                  I have read and agree to the Terms &amp; Conditions and Liability Waiver.
                  I participate at my own risk.
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setSportsDialogEvent(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending || allSelectedSports.length === 0 || !waiverAccepted}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold min-w-[140px]"
              onClick={handleSportsRegister}
            >
              {isPending ? "Submitting..." : (
                <><Trophy className="mr-1.5 size-3.5" /> Confirm Registration</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
