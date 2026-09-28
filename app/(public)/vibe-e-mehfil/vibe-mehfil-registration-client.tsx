"use client";

import {
  useState,
  useTransition,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  registerForEvent,
  cancelEventRegistration,
  searchRegisteredMembers,
} from "@/app/actions/events";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  Users,
  User,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Crown,
  ArrowRight,
  Info,
  Search,
  UserCheck,
  UserX,
  Loader2,
  ChevronDown,
  ChevronRight,
  Palette,
  Edit2,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import type { EventRow, TeamMember } from "@/types/database";
import type { MehfilEventGroup } from "@/app/actions/vibe-mehfil";
import {
  SOLO_EVENTS,
  TEAM_EVENTS,
  TEAM_EVENTS_CONFIG,
  EVENT_SCHEDULE,
  splitRegistrationByEvent,
  type TeamEvent,
  type MehfilSplitRegistration,
} from "@/lib/vibe-mehfil-constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileSnippet {
  full_name: string | null;
  phone_number: string | null;
  department: string | null;
  course: string | null;
  batch_year: string | null;
  roll_number: string | null;
  onboarding_complete: boolean;
}

interface Props {
  event: EventRow;
  isLoggedIn: boolean;
  profile: ProfileSnippet;
  existingRegistration: any | null;
  eventGroups?: MehfilEventGroup[];
}

interface MemberSearchResult {
  id: string;
  full_name: string | null;
  roll_number: string | null;
  department: string | null;
  course: string | null;
  batch_year: string | null;
  phone_number: string | null;
  institution: string | null;
}

interface TeamEventState {
  expanded: boolean;
  confirmed: boolean;
  teamName: string;
  members: TeamMember[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSchedule(eventName: string) {
  const sessions = EVENT_SCHEDULE[eventName as keyof typeof EVENT_SCHEDULE];
  if (!sessions || sessions.length === 0) return "Date TBA";
  if (sessions.length === 1) {
    const d = new Date(sessions[0].date);
    return `${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${sessions[0].time}`;
  }
  return `${sessions.length} sessions — ${new Date(sessions[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} to ${new Date(sessions[sessions.length - 1].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

// ─── Smart Member Search Row ──────────────────────────────────────────────────

interface MemberRowProps {
  index: number;
  member: TeamMember;
  onUpdate: (i: number, m: TeamMember) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}

function MemberRow({ index, member, onUpdate, onRemove, canRemove }: MemberRowProps) {
  const [query, setQuery] = useState(member.name || "");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isManual, setIsManual] = useState(!member.is_portal_registered && !!member.name);
  const debouncedQuery = useDebounce(query, 350);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isManual || member.is_portal_registered) return;
    if (debouncedQuery.length < 2) { setResults([]); setDropdownOpen(false); return; }
    setIsSearching(true);
    searchRegisteredMembers(debouncedQuery)
      .then((r) => { setResults((r.data as MemberSearchResult[]) || []); setDropdownOpen(true); })
      .finally(() => setIsSearching(false));
  }, [debouncedQuery, isManual, member.is_portal_registered]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectFromDB = (r: MemberSearchResult) => {
    onUpdate(index, {
      name: r.full_name || "",
      roll_number: r.roll_number || "",
      department: r.department || r.course || "",
      phone: r.phone_number || "",
      is_captain: false,
      is_portal_registered: true,
      profile_id: r.id,
    });
    setQuery(r.full_name || "");
    setDropdownOpen(false);
    setResults([]);
  };

  const switchToManual = () => {
    setIsManual(true);
    setDropdownOpen(false);
    setResults([]);
    onUpdate(index, { ...member, is_portal_registered: false, profile_id: undefined });
  };

  const clearSelection = () => {
    setIsManual(false);
    setQuery("");
    onUpdate(index, { name: "", roll_number: "", department: "", phone: "", is_captain: false, is_portal_registered: false, profile_id: undefined });
  };

  const isLocked = member.is_portal_registered && !!member.profile_id;

  return (
    <div className={`rounded-lg border p-3 space-y-2 transition-all ${
      isLocked ? "border-brand/40 bg-brand/5" :
      member.name ? "border-amber-400/60 bg-amber-500/5" :
      "border-border bg-background/60"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isLocked ? <UserCheck className="size-3 text-brand shrink-0" />
            : member.name ? <UserX className="size-3 text-amber-500 shrink-0" />
            : <User className="size-3 text-muted-foreground shrink-0" />}
          <span className="text-[11px] font-bold text-muted-foreground">Member #{index + 2}</span>
          {isLocked && <Badge className="bg-brand/15 text-brand border-none text-[9px] px-1 py-0">Portal ✓</Badge>}
          {!isLocked && member.name && (
            <Badge className="bg-amber-500/10 text-amber-600 border border-amber-400/40 text-[9px] px-1 py-0">
              Guest entry
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {(isLocked || member.name) && (
            <button type="button" onClick={clearSelection}
              className="text-[9px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border/60">
              Change
            </button>
          )}
          {canRemove && (
            <button type="button" onClick={() => onRemove(index)}
              className="text-muted-foreground hover:text-destructive p-0.5 ml-0.5">
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      </div>

      {isLocked ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
          <div><span className="text-muted-foreground">Name: </span><span className="font-bold text-foreground">{member.name}</span></div>
          <div><span className="text-muted-foreground">Dept: </span><span className="text-foreground">{member.department || "—"}</span></div>
          <div><span className="text-muted-foreground">Roll: </span><span className="text-foreground">{member.roll_number || "—"}</span></div>
          <div><span className="text-muted-foreground">Phone: </span><span className="text-foreground">{member.phone || "—"}</span></div>
        </div>
      ) : !isManual ? (
        <div ref={dropdownRef} className="relative">
          <div className="flex items-center rounded-md border border-border bg-card/80 focus-within:border-brand">
            {isSearching ? <Loader2 className="size-3 text-brand absolute left-2 animate-spin" />
              : <Search className="size-3 text-muted-foreground absolute left-2" />}
            <Input
              placeholder="Search by name or roll no..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); if (member.is_portal_registered) onUpdate(index, { ...member, is_portal_registered: false, profile_id: undefined }); }}
              className="h-7 text-[11px] border-0 bg-transparent pl-6 focus-visible:ring-0 shadow-none"
            />
          </div>
          {dropdownOpen && (
            <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
              {results.map((r) => (
                <button key={r.id} type="button" onClick={() => selectFromDB(r)}
                  className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-brand/10 border-b border-border/50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-foreground truncate">{r.full_name}</p>
                    <p className="text-[9px] text-muted-foreground truncate">{r.department || r.course} · {r.roll_number ? `Roll ${r.roll_number}` : ""}</p>
                  </div>
                  <Badge className="bg-brand/10 text-brand border border-brand/30 text-[9px] shrink-0 px-1 py-0">Portal</Badge>
                </button>
              ))}
              <button type="button" onClick={switchToManual}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left hover:bg-amber-500/10 text-amber-600 border-t border-border/50">
                <Plus className="size-3" />
                <span className="text-[10px] font-semibold">Add &quot;{query}&quot; as a guest entry</span>
              </button>
            </div>
          )}
          {!dropdownOpen && query.length === 0 && (
            <button type="button" onClick={switchToManual}
              className="text-[9px] text-muted-foreground hover:text-amber-600 flex items-center gap-1 mt-1">
              <Plus className="size-2.5" /> Add someone not on the portal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          <Input placeholder="Full Name *" value={member.name} onChange={(e) => onUpdate(index, { ...member, name: e.target.value })} className="h-7 text-[11px]" />
          <Input placeholder="Mobile *" type="tel" value={member.phone || ""} onChange={(e) => onUpdate(index, { ...member, phone: e.target.value })} className="h-7 text-[11px]" />
          <Input placeholder="Roll No / ID" value={member.roll_number || ""} onChange={(e) => onUpdate(index, { ...member, roll_number: e.target.value })} className="h-7 text-[11px]" />
          <Input placeholder="Department / Institute" value={member.department || ""} onChange={(e) => onUpdate(index, { ...member, department: e.target.value })} className="h-7 text-[11px]" />
        </div>
      )}
    </div>
  );
}

// ─── Team Event Accordion Row ─────────────────────────────────────────────────

interface TeamEventRowProps {
  eventName: TeamEvent;
  state: TeamEventState;
  profile: ProfileSnippet;
  onToggleExpand: () => void;
  onUpdateState: (s: Partial<TeamEventState>) => void;
  onConfirm: () => void;
  onEdit: () => void;
}

function TeamEventRow({ eventName, state, profile, onToggleExpand, onUpdateState, onConfirm, onEdit }: TeamEventRowProps) {
  const config = TEAM_EVENTS_CONFIG[eventName];
  const validMembers = state.members.filter((m) => m.name.trim().length > 0);
  const totalSquad = 1 + validMembers.length;

  const addMember = () => onUpdateState({ members: [...state.members, { name: "", roll_number: "", department: "", phone: "", is_portal_registered: false }] });
  const removeMember = (i: number) => onUpdateState({ members: state.members.filter((_, idx) => idx !== i) });
  const updateMember = useCallback((i: number, m: TeamMember) => {
    onUpdateState({ members: state.members.map((prev, idx) => idx === i ? m : prev) });
  }, [state.members, onUpdateState]);

  const canConfirm = state.teamName.trim().length > 0 && totalSquad >= config.minPlayers;

  return (
    <div className={`rounded-xl border transition-all overflow-hidden ${
      state.confirmed ? "border-brand/50 bg-brand/5 shadow-sm" :
      state.expanded ? "border-brand/30 bg-card shadow-sm" :
      "border-border bg-card/60 hover:border-border/80"
    }`}>
      <button
        type="button"
        onClick={state.confirmed ? onEdit : onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          {state.confirmed ? (
            <div className="flex size-7 items-center justify-center rounded-lg bg-brand text-brand-foreground shrink-0">
              <CheckCircle2 className="size-4" />
            </div>
          ) : (
            <div className={`flex size-7 items-center justify-center rounded-lg shrink-0 border transition-colors ${
              state.expanded ? "border-brand/40 bg-brand/10 text-brand" : "border-border bg-muted/40 text-muted-foreground"
            }`}>
              <Users className="size-3.5" />
            </div>
          )}
          <div>
            <p className={`text-sm font-bold transition-colors ${state.confirmed ? "text-brand" : "text-foreground"}`}>
              {eventName}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {config.minPlayers === config.maxPlayers ? `Team of ${config.minPlayers}` : `${config.minPlayers}–${config.maxPlayers} members`} · {formatSchedule(eventName)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {state.confirmed ? (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[11px] font-bold text-foreground">{state.teamName}</p>
                <p className="text-[9px] text-muted-foreground">{totalSquad} member{totalSquad !== 1 ? "s" : ""}</p>
              </div>
              <Badge className="bg-brand text-brand-foreground border-none text-[10px] font-bold">
                <CheckCircle2 className="size-2.5 mr-1" /> Confirmed
              </Badge>
              <Edit2 className="size-3.5 text-muted-foreground" />
            </div>
          ) : state.expanded ? (
            <ChevronDown className="size-4 text-brand" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium">Click to join</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          )}
        </div>
      </button>

      {state.expanded && !state.confirmed && (
        <div className="border-t border-border/60 px-4 pt-4 pb-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              Team Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder={`e.g. ${eventName} Squad`}
              value={state.teamName}
              onChange={(e) => onUpdateState({ teamName: e.target.value })}
              className="h-9 text-sm font-medium"
            />
          </div>

          <div className="rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="size-3.5 text-brand shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-foreground">{profile.full_name || "You (Team Lead)"}</p>
                <p className="text-[9px] text-muted-foreground">{profile.department || profile.course || "Dept"} · Roll {profile.roll_number || "—"}</p>
              </div>
            </div>
            <Badge className="bg-brand/15 text-brand border-none text-[9px] font-bold">Member 1 (Lead)</Badge>
          </div>

          <div className="space-y-2">
            {state.members.map((m, i) => (
              <MemberRow
                key={i}
                index={i}
                member={m}
                onUpdate={updateMember}
                onRemove={removeMember}
                canRemove={state.members.length > 1}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            {totalSquad < config.maxPlayers ? (
              <button type="button" onClick={addMember}
                className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand/80 transition-colors">
                <Plus className="size-3.5" /> Add member
              </button>
            ) : <span />}
            <span className={`text-[10px] font-semibold ${
              totalSquad >= config.minPlayers ? "text-brand" : "text-muted-foreground"
            }`}>
              Team: {totalSquad} / {config.maxPlayers}
              {totalSquad < config.minPlayers && ` (need ${config.minPlayers - totalSquad} more)`}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button type="button" size="sm"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="flex-1 h-8 text-xs font-bold bg-brand hover:bg-brand/90 text-brand-foreground disabled:opacity-40">
              <CheckCircle2 className="size-3.5 mr-1.5" />
              Confirm {eventName} Team
            </Button>
            <Button type="button" size="sm" variant="ghost"
              onClick={onToggleExpand}
              className="h-8 text-xs text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const defaultMemberRow = (): TeamMember => ({
  name: "", roll_number: "", department: "", phone: "", is_captain: false, is_portal_registered: false,
});

const defaultTeamState = (): TeamEventState => ({
  expanded: false,
  confirmed: false,
  teamName: "",
  members: [defaultMemberRow()],
});

export function VibeMehfilRegistrationClient({ event, isLoggedIn, profile, existingRegistration, eventGroups = [] }: Props) {
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(Boolean(existingRegistration));
  const [currentReg, setCurrentReg] = useState<any | null>(existingRegistration);
  const [allEventGroups, setAllEventGroups] = useState<MehfilEventGroup[]>(eventGroups);
  const [activeRosterEvent, setActiveRosterEvent] = useState<string>(TEAM_EVENTS[0]);

  const [selectedSolos, setSelectedSolos] = useState<Set<string>>(new Set());

  const [teamStates, setTeamStates] = useState<Map<string, TeamEventState>>(
    new Map(TEAM_EVENTS.map((s) => [s, defaultTeamState()]))
  );

  const [contactPhone, setContactPhone] = useState(profile.phone_number || "");

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsExpanded, setTermsExpanded] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isLoggedIn) {
      toast.error("Student Registration Required", {
        description: "Please sign in and complete your student profile before joining any events.",
        duration: 7000,
        action: { label: "Sign In", onClick: () => router.push("/login") },
      });
    } else if (!profile.onboarding_complete) {
      toast.error("Complete Your Profile First", {
        description: "Your student profile is incomplete. Finish it before registering for Vibe-e-Mehfil.",
        duration: 7000,
        action: { label: "Complete", onClick: () => router.push("/onboarding") },
      });
    }
  }, [isLoggedIn, profile.onboarding_complete, router]);

  const toggleSolo = (name: string) =>
    setSelectedSolos((prev) => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  const updateTeam = (name: string, patch: Partial<TeamEventState>) => {
    setTeamStates((prev) => {
      const n = new Map(prev);
      n.set(name, { ...n.get(name)!, ...patch });
      return n;
    });
  };

  const toggleExpand = (name: string) => {
    const cur = teamStates.get(name)!;
    if (cur.confirmed) return;
    updateTeam(name, { expanded: !cur.expanded });
  };

  const confirmTeam = (name: string) => {
    const s = teamStates.get(name)!;
    const config = TEAM_EVENTS_CONFIG[name as TeamEvent];
    const squad = 1 + s.members.filter((m) => m.name.trim()).length;
    if (!s.teamName.trim() || squad < config.minPlayers) return;
    updateTeam(name, { confirmed: true, expanded: false });
    toast.success(`✓ ${name} team "${s.teamName}" confirmed!`, { duration: 2500 });
  };

  const editTeam = (name: string) => {
    updateTeam(name, { confirmed: false, expanded: true });
  };

  const confirmedTeams: { eventName: TeamEvent; state: TeamEventState }[] = [];
  for (const [name, state] of teamStates) {
    if (state.confirmed) confirmedTeams.push({ eventName: name as TeamEvent, state });
  }

  const hasAnySelection = selectedSolos.size > 0 || confirmedTeams.length > 0;

  const currentRegSplit = (() => {
    if (!currentReg) return null as MehfilSplitRegistration | null;
    return splitRegistrationByEvent(currentReg);
  })();

  const handleSubmit = () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (!profile.onboarding_complete) { router.push("/onboarding"); return; }
    if (!termsAccepted) { toast.error("Please accept the participation guidelines to continue."); return; }
    if (!hasAnySelection) { toast.error("Select at least one event or confirm at least one team."); return; }

    const multiTeamEntries = confirmedTeams.map(({ eventName, state }) => ({
      sport: eventName,
      teamName: state.teamName.trim(),
      members: state.members.filter((m) => m.name.trim()),
    }));

    startTransition(async () => {
      const result = await registerForEvent(event.id, {
        isSportsEvent: true,
        waiverAccepted: true,
        phoneNumber: contactPhone || profile.phone_number || undefined,
        soloChoices: Array.from(selectedSolos),
        multiTeams: multiTeamEntries,
      });

      if (result.success) {
        setIsRegistered(true);
        setCurrentReg({
          sport_choices: [...Array.from(selectedSolos), ...multiTeamEntries.map((t) => t.sport)],
          team_name: multiTeamEntries.map((t) => `${t.sport}: ${t.teamName}`).join(" | "),
          is_captain: multiTeamEntries.length > 0,
          team_members: multiTeamEntries.flatMap((t) => t.members),
        });

        toast.success("🎉 You're in! Registration Complete", {
          description: `Registered for ${selectedSolos.size} event${selectedSolos.size !== 1 ? "s" : ""} + ${confirmedTeams.length} team event${confirmedTeams.length !== 1 ? "s" : ""}.`,
        });
      } else {
        toast.error(result.error || "Registration failed. Please try again.");
      }
    });
  };

  const handleCancel = () => setCancelConfirmOpen(true);

  const handleCancelConfirmed = () => {
    setCancelConfirmOpen(false);
    startTransition(async () => {
      const res = await cancelEventRegistration(event.id);
      if (res.success) { setIsRegistered(false); setCurrentReg(null); toast.info("Registration cancelled."); }
      else toast.error(res.error || "Failed to cancel.");
    });
  };

  return (
    <>
    <div className="pb-20">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-brand/10 via-background to-background pt-12 pb-14">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand mb-4">
            <Palette className="size-3.5" /> Kaleidoscope — The Cultural Club by SAAHS
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Vibe-e-<span className="text-brand">Mehfil</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
            Create • Express • Celebrate. Pick as many indoor cultural events as you like — solo or as a team — all in one registration.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2">
              <Calendar className="size-3.5 text-brand" /> Starting 5th October 2026
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2">
              <Clock className="size-3.5 text-brand" /> Most events 2:00 – 4:00 PM
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3.5 py-2">
              <MapPin className="size-3.5 text-brand" /> {event.venue || "SAAHS Campus (Indoor)"}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 mt-10">

        {/* ── Already registered — confirmation card ───────────────────── */}
        {isRegistered && currentReg && (
          <div className="mb-10 rounded-2xl border-2 border-brand/40 bg-gradient-to-br from-brand/5 via-card to-background p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-lg">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">You Are Registered!</h2>
                    <Badge className="bg-brand text-brand-foreground border-none text-xs">Confirmed</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Kaleidoscope — Vibe-e-Mehfil 2026</p>
                </div>
              </div>
              <Button variant="outline" size="sm"
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={handleCancel} disabled={isPending}>
                Cancel Registration
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {currentRegSplit && currentRegSplit.soloEvents.length > 0 && (
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Solo Events</p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentRegSplit.soloEvents.map((s: string) => (
                      <Badge key={s} className="bg-brand/10 text-brand border border-brand/30 text-[10px]">
                        <Sparkles className="size-2.5 mr-1" />{s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {currentRegSplit && currentRegSplit.teamEntries.length > 0 && (
                <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
                  <p className="text-[10px] uppercase font-bold text-brand tracking-wider mb-2">Team Events</p>
                  <div className="space-y-1">
                    {currentRegSplit.teamEntries.map((t) => (
                      <div key={t.event} className="flex items-center gap-2 text-xs">
                        <Users className="size-3 text-brand" />
                        <span className="font-bold text-foreground">{t.event}</span>
                        <span className="text-muted-foreground">— {t.teamName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Not logged in banner ─────────────────────────────────────── */}
        {!isLoggedIn && (
          <div className="mb-6 rounded-2xl border border-brand/30 bg-brand/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Info className="size-4 text-brand shrink-0" />
              <p className="text-sm text-foreground">Sign in to register for Vibe-e-Mehfil.</p>
            </div>
            <Button asChild size="sm" className="bg-brand hover:bg-brand/90 text-brand-foreground font-bold shrink-0">
              <Link href="/login">Sign In / Register</Link>
            </Button>
          </div>
        )}

        {/* ── Registration Form (hidden when already registered) ────────── */}
        {!isRegistered && (
        <div className="grid gap-8 lg:grid-cols-12">

          <div className="lg:col-span-8 space-y-8">

            {/* SOLO EVENTS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-brand/15 text-brand font-bold text-xs">
                  <Sparkles className="size-3.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Solo Events</h2>
                  <p className="text-[11px] text-muted-foreground">Tick any you want to compete in individually</p>
                </div>
                {selectedSolos.size > 0 && (
                  <Badge className="ml-auto bg-brand/15 text-brand border-none text-xs font-bold">
                    {selectedSolos.size} selected
                  </Badge>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {SOLO_EVENTS.map((name) => {
                  const checked = selectedSolos.has(name);
                  return (
                    <label key={name}
                      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 cursor-pointer transition-all text-xs font-medium ${
                        checked ? "border-brand bg-brand/10 text-brand shadow-xs" : "border-border bg-card hover:bg-muted/30 text-foreground"
                      }`}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleSolo(name)}
                        className={`mt-0.5 ${checked ? "border-brand bg-brand text-brand-foreground" : ""}`}
                      />
                      <span>
                        <span className="block">{name}</span>
                        <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">{formatSchedule(name)}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* TEAM EVENTS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-brand/15 text-brand font-bold text-xs">
                  <Users className="size-3.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Team Events</h2>
                  <p className="text-[11px] text-muted-foreground">Click an event to expand it and create your team</p>
                </div>
                {confirmedTeams.length > 0 && (
                  <Badge className="ml-auto bg-brand/15 text-brand border-none text-xs font-bold">
                    {confirmedTeams.length} team{confirmedTeams.length > 1 ? "s" : ""} confirmed
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {TEAM_EVENTS.map((name) => {
                  const state = teamStates.get(name)!;
                  return (
                    <TeamEventRow
                      key={name}
                      eventName={name}
                      state={state}
                      profile={profile}
                      onToggleExpand={() => toggleExpand(name)}
                      onUpdateState={(patch) => updateTeam(name, patch)}
                      onConfirm={() => confirmTeam(name)}
                      onEdit={() => editTeam(name)}
                    />
                  );
                })}
              </div>
            </div>

            {/* ── Terms ───────────────────────────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <button type="button" onClick={() => setTermsExpanded((v) => !v)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 text-brand shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-foreground">Participation Guidelines</span>
                  <span className="text-destructive font-bold text-xs">*</span>
                </div>
                <span className="text-xs text-brand font-semibold shrink-0 ml-2">
                  {termsExpanded ? "Hide ▲" : "View ▼"}
                </span>
              </button>
              {termsExpanded && (
                <div className="p-4 border-t border-border text-xs text-muted-foreground leading-relaxed space-y-1.5 bg-background/50 max-h-52 overflow-y-auto">
                  <p className="font-bold text-foreground">Kaleidoscope — Vibe-e-Mehfil 2026</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Report to your event venue at least 10 minutes before the scheduled start time.</li>
                    <li>For team events, the Team Lead is responsible for squad communication and reporting.</li>
                    <li>Judges' and Kaleidoscope committee decisions are final and binding.</li>
                    <li>All participants must maintain good conduct and follow campus guidelines.</li>
                    <li>Event schedules are subject to change; check the SAAHS notices page for updates.</li>
                    <li>Materials for events like Rangoli, Mehndi and Art & Craft must be brought by participants unless stated otherwise.</li>
                  </ol>
                </div>
              )}
              <div className="flex items-start gap-3 p-4 border-t border-border bg-card">
                <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(v) => setTermsAccepted(Boolean(v))} className="mt-0.5" />
                <label htmlFor="terms" className="text-xs text-foreground cursor-pointer leading-snug">
                  I have read and accept the Participation Guidelines on behalf of myself and my team(s).
                </label>
              </div>
            </div>

            {/* ── Submit ──────────────────────────────────────────────── */}
            <div className="space-y-3">
              {(confirmedTeams.length > 0) && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <label className="text-xs font-semibold text-foreground shrink-0">Contact Phone:</label>
                  <Input
                    type="tel"
                    placeholder="WhatsApp / contact number"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="h-8 text-xs border-0 bg-transparent focus-visible:ring-0 shadow-none flex-1"
                  />
                </div>
              )}

              <Button type="button" size="lg" onClick={handleSubmit}
                disabled={isPending || !termsAccepted || !hasAnySelection}
                className="w-full h-12 text-sm sm:text-base font-bold bg-brand hover:bg-brand/90 text-brand-foreground shadow-lg shadow-brand/25 disabled:opacity-50">
                {isPending ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" />Submitting Registration...</>
                ) : (
                  <>
                    <ListChecks className="size-4 mr-2" />
                    Register for All Selected Events
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ── Right: Live Summary Sidebar ─────────────────────────── */}
          <div className="lg:col-span-4 space-y-5">

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 sticky top-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-brand" /> Your Selections
              </h4>

              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="size-3 text-brand" /> Solo Events
                </p>
                {selectedSolos.size === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">None selected</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {Array.from(selectedSolos).map((s) => (
                      <Badge key={s} className="bg-brand/10 text-brand border border-brand/30 text-[9px] flex items-center gap-1">
                        {s}
                        <button type="button" onClick={() => toggleSolo(s)} className="hover:text-destructive ml-0.5">
                          <X className="size-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5 flex items-center gap-1">
                  <Users className="size-3 text-brand" /> Team Events
                </p>
                {confirmedTeams.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground italic">No teams confirmed yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {confirmedTeams.map(({ eventName, state }) => {
                      const squad = 1 + state.members.filter((m) => m.name.trim()).length;
                      return (
                        <div key={eventName} className="rounded-lg border border-brand/20 bg-brand/5 px-2.5 py-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{eventName}</span>
                            <Badge className="bg-brand text-brand-foreground border-none text-[9px] px-1.5 py-0">Lead</Badge>
                          </div>
                          <p className="text-muted-foreground">{state.teamName} · {squad} member{squad !== 1 ? "s" : ""}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-border/60 pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration Fee:</span>
                  <span className="font-bold text-brand">Free</span>
                </div>
              </div>
            </div>

            {/* Team Size Guide */}
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-2">
                <Users className="size-3.5" /> Team Size Guide
              </h4>
              <div className="overflow-x-auto text-[10px] rounded-lg border border-border bg-card">
                <table className="w-full">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border font-bold">
                    <tr>
                      <th className="py-1.5 px-2 text-left">Event</th>
                      <th className="py-1.5 px-2 text-center">Team</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {TEAM_EVENTS.map((name) => {
                      const c = TEAM_EVENTS_CONFIG[name];
                      return (
                        <tr key={name} className="hover:bg-muted/20">
                          <td className="py-1 px-2 font-medium text-foreground">{name}</td>
                          <td className="py-1 px-2 text-center font-mono font-bold text-brand">
                            {c.minPlayers === c.maxPlayers ? c.minPlayers : `${c.minPlayers}–${c.maxPlayers}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Help */}
            <div className="rounded-2xl border border-border bg-card p-4 text-xs space-y-1.5">
              <h4 className="font-bold text-foreground">Need Help?</h4>
              <p className="text-muted-foreground text-[11px]">Contact the Kaleidoscope committee for queries about events, teams, or scheduling.</p>
              <Link href="/help-desk" className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline">
                Help Desk <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
        )} {/* end !isRegistered form */}

        {/* ── Registered Participants Board ───────────────────────────── */}
        <section className="mt-16 pt-10 border-t border-border">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 border border-brand/20 px-3 py-1 text-xs font-bold text-brand mb-2">
              <Sparkles className="size-3.5" /> Registrations
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Registered Teams <span className="text-brand">Per Event</span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {TEAM_EVENTS.map((name) => {
              const group = allEventGroups.find((g) => g.event === name);
              const count = group?.teams.length || 0;
              const sel = activeRosterEvent === name;
              return (
                <button key={name} type="button" onClick={() => setActiveRosterEvent(name)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    sel ? "bg-brand text-brand-foreground shadow-md" : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}>
                  {name}
                  <span className={`text-[10px] rounded-full px-1.5 font-bold ${sel ? "bg-white/20 text-white" : "bg-background text-muted-foreground"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {(() => {
            const group = allEventGroups.find((g) => g.event === activeRosterEvent);
            const teams = group?.teams || [];
            if (teams.length === 0) return (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center bg-card/50">
                <Users className="size-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="font-bold text-foreground text-sm">No Teams Yet for {activeRosterEvent}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">Be the first — expand {activeRosterEvent} above to create your team.</p>
              </div>
            );
            return (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team, idx) => (
                  <div key={team.id || idx} className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm hover:border-brand/40 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">TEAM #{idx + 1}</span>
                        <h4 className="text-sm font-extrabold text-foreground">{team.teamName}</h4>
                      </div>
                      <Badge className="bg-brand/10 text-brand border border-brand/30 text-[10px] font-bold">
                        {team.members.length > 0 ? `${team.members.length} Members` : "Team"}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-brand/20 bg-brand/5 p-2.5 flex items-center gap-2 text-xs">
                      <Crown className="size-3.5 text-brand shrink-0" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-brand block">Team Lead</span>
                        <span className="font-bold text-foreground">{team.captain.name}</span>
                        <span className="text-muted-foreground text-[10px] block">{team.captain.department || "SAAHS"}</span>
                      </div>
                    </div>
                    {team.members?.length > 0 && (
                      <div className="rounded-lg border border-border text-xs bg-muted/10 max-h-36 overflow-y-auto divide-y divide-border/50">
                        {team.members.map((m: TeamMember, mi: number) => (
                          <div key={mi} className="px-2.5 py-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {m.is_captain ? <Crown className="size-3 text-brand" /> : m.is_portal_registered ? <UserCheck className="size-3 text-brand" /> : <UserX className="size-3 text-amber-500" />}
                              <span className="font-medium text-foreground">{m.name}{m.is_captain && <span className="text-[9px] text-brand font-bold ml-1">(Lead)</span>}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{m.roll_number || m.department || "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
      </div>
    </div>

    {/* ── Cancel Confirmation Dialog ───────────────────────────────── */}
    <Dialog open={cancelConfirmOpen} onOpenChange={(open) => !open && setCancelConfirmOpen(false)}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 mb-2">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <DialogTitle className="text-base font-bold">Cancel Vibe-e-Mehfil Registration?</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">
          Are you sure you want to cancel your registration for <strong className="text-foreground">Vibe-e-Mehfil 2026</strong>? All your solo and team registrations will be removed.
        </div>
        <DialogFooter className="gap-2">
          <Button size="sm" variant="outline" onClick={() => setCancelConfirmOpen(false)} disabled={isPending}>
            Keep Registration
          </Button>
          <Button size="sm" variant="destructive" disabled={isPending} onClick={handleCancelConfirmed}>
            {isPending ? "Cancelling..." : "Yes, Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
