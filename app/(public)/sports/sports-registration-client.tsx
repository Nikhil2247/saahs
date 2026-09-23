"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerForEvent, cancelEventRegistration } from "@/app/actions/events";
import {
  SOLO_SPORTS,
  TEAM_SPORTS,
  TEAM_SPORTS_CONFIG,
  type TeamSport,
} from "@/lib/sports-constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trophy,
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
  Zap,
  Crown,
  BookOpen,
  GraduationCap,
  Sparkles,
  Phone,
  ArrowRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { EventRow, TeamMember } from "@/types/database";
import type { SportTeamGroup } from "@/app/actions/events";

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
  teamsBySport?: SportTeamGroup[];
}

export function SportsRegistrationClient({
  event,
  isLoggedIn,
  profile,
  existingRegistration,
  teamsBySport = [],
}: Props) {
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(Boolean(existingRegistration));
  const [currentReg, setCurrentReg] = useState<any | null>(existingRegistration);
  const [allTeamsBySport, setAllTeamsBySport] = useState<SportTeamGroup[]>(teamsBySport);
  const [activeRosterSport, setActiveRosterSport] = useState<string>("Football");

  // Registration Type: "team" or "solo"
  const [regMode, setRegMode] = useState<"team" | "solo">("team");

  // Solo sports selected
  const [selectedSoloSports, setSelectedSoloSports] = useState<string[]>([]);

  // Team registration state
  const [selectedTeamSport, setSelectedTeamSport] = useState<TeamSport>("Football");
  const [teamName, setTeamName] = useState("");
  const [captainPhone, setCaptainPhone] = useState(profile.phone_number || "");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      name: "",
      roll_number: "",
      department: "",
      phone: "",
    },
  ]);

  // Waiver
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverExpanded, setWaiverExpanded] = useState(false);

  const [isPending, startTransition] = useTransition();

  const activeSportConfig = TEAM_SPORTS_CONFIG[selectedTeamSport];

  // Captain is player #1
  const totalSquadCount = 1 + teamMembers.filter((m) => m.name.trim()).length;

  const toggleSolo = (sport: string) => {
    setSelectedSoloSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const addMemberRow = () => {
    setTeamMembers((prev) => [
      ...prev,
      { name: "", roll_number: "", department: "", phone: "" },
    ]);
  };

  const removeMemberRow = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMemberRow = (
    index: number,
    field: keyof TeamMember,
    value: string
  ) => {
    setTeamMembers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (!profile.onboarding_complete) {
      toast.error("Please complete your profile onboarding before registering.");
      router.push("/onboarding");
      return;
    }

    if (!waiverAccepted) {
      toast.error("You must accept the Liability Waiver & Terms to register.");
      return;
    }

    if (regMode === "solo") {
      if (selectedSoloSports.length === 0) {
        toast.error("Please select at least one solo sport to register for.");
        return;
      }

      startTransition(async () => {
        const result = await registerForEvent(event.id, {
          registrationType: "solo",
          sportChoices: selectedSoloSports,
          waiverAccepted: true,
          isSportsEvent: true,
          phoneNumber: captainPhone || profile.phone_number || undefined,
        });

        if (result.success) {
          setIsRegistered(true);
          setCurrentReg({
            sport_choices: selectedSoloSports,
            team_name: null,
            is_captain: false,
            team_members: [],
          });
          toast.success("🏆 Solo Registration Confirmed!", {
            description: `You are registered for: ${selectedSoloSports.join(", ")}`,
          });
        } else {
          toast.error(result.error || "Registration failed");
        }
      });
    } else {
      // Team registration
      if (!teamName.trim()) {
        toast.error("Please enter a name for your team.");
        return;
      }

      const validMembers = teamMembers.filter((m) => m.name.trim().length > 0);
      if (validMembers.length === 0) {
        toast.error("Please add at least one teammate to your squad.");
        return;
      }

      // Build complete squad roster with Captain marked
      const squadRoster: TeamMember[] = [
        {
          name: profile.full_name || "Captain",
          roll_number: profile.roll_number || undefined,
          department: profile.department || profile.course || undefined,
          phone: captainPhone || profile.phone_number || undefined,
          is_captain: true,
        },
        ...validMembers.map((m) => ({
          name: m.name.trim(),
          roll_number: m.roll_number?.trim() || undefined,
          department: m.department?.trim() || undefined,
          phone: m.phone?.trim() || undefined,
          is_captain: false,
        })),
      ];

      startTransition(async () => {
        const result = await registerForEvent(event.id, {
          registrationType: "team",
          teamName: teamName.trim(),
          isCaptain: true,
          teamMembers: squadRoster,
          sportChoices: [selectedTeamSport],
          waiverAccepted: true,
          isSportsEvent: true,
          phoneNumber: captainPhone || profile.phone_number || undefined,
        });

        if (result.success) {
          setIsRegistered(true);
          setCurrentReg({
            sport_choices: [selectedTeamSport],
            team_name: teamName.trim(),
            is_captain: true,
            team_members: squadRoster,
          });

          // Add to live teams roster
          setAllTeamsBySport((prev) => {
            const copy = [...prev];
            const group = copy.find((g) => g.sport === selectedTeamSport);
            if (group) {
              group.teams = [
                ...group.teams,
                {
                  id: Date.now(),
                  teamName: teamName.trim(),
                  captain: {
                    name: profile.full_name || "Captain",
                    department: profile.department || profile.course || undefined,
                    rollNumber: profile.roll_number || undefined,
                    phone: captainPhone || undefined,
                  },
                  members: squadRoster,
                  registeredAt: new Date().toISOString(),
                },
              ];
            }
            return copy;
          });
          setActiveRosterSport(selectedTeamSport);

          toast.success("🎉 Team Registered Successfully!", {
            description: `Team "${teamName.trim()}" created with ${squadRoster.length} players. You are the Captain!`,
          });
        } else {
          toast.error(result.error || "Registration failed");
        }
      });
    }
  };

  const handleCancelRegistration = () => {
    if (!confirm("Are you sure you want to cancel your sports registration?")) return;
    startTransition(async () => {
      const result = await cancelEventRegistration(event.id);
      if (result.success) {
        setIsRegistered(false);
        setCurrentReg(null);
        toast.info("Registration cancelled.");
      } else {
        toast.error(result.error || "Failed to cancel registration");
      }
    });
  };

  return (
    <div className="pb-20">
      {/* ── Hero Banner ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-amber-500/10 via-background to-background pt-12 pb-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-4 shadow-sm">
              <Trophy className="size-3.5 text-amber-500" /> SAAHS Annual Sports Festival 2026
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl leading-tight">
              Unleash the Champion Within.{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Create Your Squad
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl">
              Solo games and team tournaments. One student creates the team as{" "}
              <strong className="text-foreground">Captain</strong> and adds teammates to compete for their department!
            </p>

            {/* Quick stats pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 shadow-sm">
                <Calendar className="size-4 text-amber-500" />
                <span>
                  {new Date(event.schedule).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 shadow-sm">
                <Clock className="size-4 text-amber-500" />
                <span>Starts 9:00 AM IST</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 shadow-sm">
                <MapPin className="size-4 text-amber-500" />
                <span>{event.venue || "PGIMER Sports Complex, Chandigarh"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Container ─────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 mt-10">
        {/* If already registered, show registration pass / confirmation */}
        {isRegistered && currentReg && (
          <div className="mb-10 overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-background p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
                  <CheckCircle2 className="size-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-foreground">You Are Registered!</h2>
                    <Badge className="bg-emerald-500 text-white border-none text-xs">
                      Confirmed
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SAAHS Sports Festival 2026 · Official Registration
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={handleCancelRegistration}
                disabled={isPending}
              >
                Cancel Registration
              </Button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Registration details */}
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Selected Event(s)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(currentReg.sport_choices || []).map((s: string) => (
                      <Badge
                        key={s}
                        className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3 py-1 text-xs font-semibold"
                      >
                        <Trophy className="size-3 mr-1 text-amber-500" />
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {currentReg.team_name && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Registered Team
                      </span>
                      {currentReg.is_captain && (
                        <Badge className="bg-amber-500 text-white text-[10px] font-bold border-none">
                          <Crown className="size-3 mr-1" /> You are Captain
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-extrabold text-foreground">{currentReg.team_name}</p>
                  </div>
                )}
              </div>

              {/* Team roster if team */}
              {Array.isArray(currentReg.team_members) && currentReg.team_members.length > 0 ? (
                <div className="rounded-xl border border-border bg-card p-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Squad Roster ({currentReg.team_members.length} Players)
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {currentReg.team_members.map((member: TeamMember, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {member.is_captain ? (
                            <Crown className="size-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                              #{idx + 1}
                            </span>
                          )}
                          <span className="font-semibold text-foreground">
                            {member.name}
                            {member.is_captain && (
                              <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                (Captain)
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {member.roll_number || member.department || "Player"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-center text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Solo Event Registration</p>
                  <p>
                    You are registered as an individual participant. Report to the sports coordinator at the venue on event day!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Registration Form Section ──────────────────────────────── */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Left Column: Form & Squad Builder */}
          <div className="lg:col-span-8 space-y-8">
            {/* Mode Switch: Team vs Solo */}
            <div className="flex rounded-2xl border border-border bg-muted/40 p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setRegMode("team")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  regMode === "team"
                    ? "bg-card text-foreground shadow-md border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="size-4 text-amber-500" />
                Team Events (Create Squad as Captain)
              </button>
              <button
                type="button"
                onClick={() => setRegMode("solo")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  regMode === "solo"
                    ? "bg-card text-foreground shadow-md border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Zap className="size-4 text-blue-500" />
                Solo Events (Individual)
              </button>
            </div>

            {/* If Not Logged In Notice */}
            {!isLoggedIn && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Info className="size-5 text-amber-500 shrink-0" />
                  <p className="text-xs sm:text-sm text-foreground">
                    Please <strong>Sign In with Google</strong> to register your team or solo sports.
                  </p>
                </div>
                <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white font-bold shrink-0">
                  <Link href="/login">Sign In with Google</Link>
                </Button>
              </div>
            )}

            {/* TEAM REGISTRATION MODE */}
            {regMode === "team" && (
              <div className="space-y-6">
                {/* 1. Sport Selection */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      1
                    </div>
                    <h3 className="text-base font-bold text-foreground">Select Team Sport</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {TEAM_SPORTS.map((sport) => {
                      const isSelected = selectedTeamSport === sport;
                      const conf = TEAM_SPORTS_CONFIG[sport];
                      return (
                        <button
                          key={sport}
                          type="button"
                          onClick={() => setSelectedTeamSport(sport)}
                          className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/20"
                              : "border-border bg-background hover:border-border/80 hover:bg-muted/40"
                          }`}
                        >
                          <span className={`text-xs font-bold ${isSelected ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                            {sport}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {conf?.minPlayers}–{conf?.maxPlayers} players
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeSportConfig && (
                    <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
                      <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground font-semibold">{selectedTeamSport}: </strong>
                        {activeSportConfig.description} (Min {activeSportConfig.minPlayers} players, max {activeSportConfig.maxPlayers} including reserves).
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Team Name */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Team Details</h3>
                      <p className="text-xs text-muted-foreground">Give your squad a proud team name</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      Team Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="e.g. PGIMER Strikers, Radiotherapy Titans, etc."
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="h-10 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* 3. Team Captain (The Creator) */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-card to-background p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs">
                        3
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                          Team Captain <Crown className="size-4 text-amber-500" />
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          As the creator of this team, you are designated as the Captain
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-amber-500 text-white text-[11px] font-bold border-none">
                      Captain (You)
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 bg-card rounded-xl border border-border p-4">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block">Captain Name</label>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {profile.full_name || "You (Logged-in User)"}
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block">Department / Course</label>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {profile.department || profile.course || "Allied Health Sciences"}
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block">Roll / Student ID</label>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {profile.roll_number || "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block">
                        Captain Contact Number <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="WhatsApp / Phone number"
                        value={captainPhone}
                        onChange={(e) => setCaptainPhone(e.target.value)}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Squad Members Roster */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        4
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Add Squad Members</h3>
                        <p className="text-xs text-muted-foreground">
                          Add the rest of your teammates to complete the roster
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2.5 py-1 font-semibold">
                        <Users className="size-3 mr-1 text-amber-500" />
                        Total Squad: {totalSquadCount}{" "}
                        {activeSportConfig && (
                          <span className="text-muted-foreground font-normal ml-1">
                            (Target: {activeSportConfig.minPlayers}–{activeSportConfig.maxPlayers})
                          </span>
                        )}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addMemberRow}
                        className="h-8 text-xs font-semibold"
                      >
                        <Plus className="size-3.5 mr-1" /> Add Player
                      </Button>
                    </div>
                  </div>

                  {/* List of squad rows */}
                  <div className="space-y-3">
                    {/* Captain Row (Locked) */}
                    <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <Crown className="size-4 text-amber-500" />
                        <div>
                          <p className="font-bold text-foreground">
                            {profile.full_name || "Captain (You)"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {profile.department || "Department"} · Roll #{profile.roll_number || "—"}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-none text-[10px] font-bold">
                        Player 1 (Captain)
                      </Badge>
                    </div>

                    {/* Member Input Rows */}
                    {teamMembers.map((member, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-border bg-background p-3.5 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                            <User className="size-3.5 text-primary" /> Player #{index + 2}
                          </span>
                          {teamMembers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMemberRow(index)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              title="Remove player"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <div>
                            <Input
                              placeholder="Full Name *"
                              value={member.name}
                              onChange={(e) => updateMemberRow(index, "name", e.target.value)}
                              className="h-8 text-xs font-medium"
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Roll No / Student ID"
                              value={member.roll_number || ""}
                              onChange={(e) => updateMemberRow(index, "roll_number", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Input
                              placeholder="Department / Course"
                              value={member.department || ""}
                              onChange={(e) => updateMemberRow(index, "department", e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addMemberRow}
                    className="mt-3 w-full border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  >
                    <Plus className="size-3.5 mr-1" /> Add Another Teammate
                  </Button>
                </div>
              </div>
            )}

            {/* SOLO REGISTRATION MODE */}
            {regMode === "solo" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      1
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Select Solo Events</h3>
                      <p className="text-xs text-muted-foreground">
                        You can select one or multiple individual sports to participate in
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {SOLO_SPORTS.map((sport) => {
                      const checked = selectedSoloSports.includes(sport);
                      return (
                        <label
                          key={sport}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                            checked
                              ? "border-blue-500 bg-blue-500/10 text-blue-800 dark:text-blue-300 font-semibold"
                              : "border-border bg-background hover:bg-muted/40 text-foreground"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleSolo(sport)}
                            className={checked ? "border-blue-500 bg-blue-500" : ""}
                          />
                          <span className="text-xs">{sport}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Solo Participant details */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Participant Information</h3>
                      <p className="text-xs text-muted-foreground">Auto-filled from your profile</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 bg-muted/20 rounded-xl border border-border p-4">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block">Name</label>
                      <p className="text-sm font-bold text-foreground mt-0.5">
                        {profile.full_name || "Participant"}
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block">Department</label>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {profile.department ?? profile.course ?? "Allied Health Sciences"}
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block">Roll Number</label>
                      <p className="text-sm font-medium text-foreground mt-0.5">
                        {profile.roll_number ?? "—"}
                      </p>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block">Contact Phone</label>
                      <Input
                        type="tel"
                        placeholder="WhatsApp / Phone number"
                        value={captainPhone}
                        onChange={(e) => setCaptainPhone(e.target.value)}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Liability Waiver & Terms ─────────────────────────── */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setWaiverExpanded((v) => !v)}
                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    Tournament Rules, Terms &amp; Liability Waiver
                  </span>
                  <span className="text-destructive font-bold text-xs">*</span>
                </div>
                <span className="text-xs text-brand font-semibold shrink-0 ml-2">
                  {waiverExpanded ? "Hide Terms ▲" : "View Rules & Terms ▼"}
                </span>
              </button>

              {waiverExpanded && (
                <div className="p-4 sm:p-5 border-t border-border text-xs text-muted-foreground leading-relaxed space-y-2 bg-background/50 max-h-56 overflow-y-auto">
                  <p className="font-bold text-foreground">
                    Official SAAHS Sports Festival 2026 Participation Terms
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 pl-1">
                    <li>I confirm that I and all registered team members are medically fit to participate.</li>
                    <li>For team events, the registered Captain is responsible for squad communication and reporting on match time.</li>
                    <li>Referees and Sports Committee decisions are final and binding on all participating squads.</li>
                    <li>SAAHS and host institution will not be held liable for accidental injuries or personal loss during events.</li>
                    <li>All participants agree to maintain high sportsmanship and adhere to campus conduct guidelines.</li>
                    <li>Event schedules are subject to ground availability and weather conditions.</li>
                  </ol>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 border-t border-border bg-card">
                <Checkbox
                  id="waiver-box"
                  checked={waiverAccepted}
                  onCheckedChange={(v) => setWaiverAccepted(Boolean(v))}
                  className="mt-0.5"
                />
                <label htmlFor="waiver-box" className="text-xs text-foreground cursor-pointer leading-snug">
                  I have read and accepted the Terms, Tournament Rules, and Liability Waiver on behalf of myself / my team squad.
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="button"
                size="lg"
                onClick={handleSubmit}
                disabled={isPending || !waiverAccepted}
                className="w-full h-12 text-sm sm:text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25"
              >
                {isPending ? (
                  "Submitting Registration..."
                ) : regMode === "team" ? (
                  <>
                    <Crown className="size-4 mr-2" /> Register Team as Captain
                  </>
                ) : (
                  <>
                    <Zap className="size-4 mr-2" /> Submit Solo Registration
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Information, Guidelines & Summary */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Registration Summary Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" /> Registration Summary
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-bold text-foreground uppercase">{regMode}</span>
                </div>

                {regMode === "team" ? (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-muted-foreground">Team Sport:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {selectedTeamSport}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-muted-foreground">Team Name:</span>
                      <span className="font-bold text-foreground">
                        {teamName.trim() || "Not set yet"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-muted-foreground">Team Captain:</span>
                      <span className="font-bold text-foreground">
                        {profile.full_name || "You"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/60">
                      <span className="text-muted-foreground">Squad Players:</span>
                      <span className="font-bold text-foreground">
                        {totalSquadCount} player(s)
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="py-1.5 border-b border-border/60">
                    <span className="text-muted-foreground block mb-1">Solo Sports:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedSoloSports.length > 0 ? (
                        selectedSoloSports.map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {s}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground italic">None selected yet</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Registration Fee:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Free / Member</span>
                </div>
              </div>
            </div>

            {/* Guide to Team Player Composition (Poster) */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Team Player Composition Guide
                </h4>
              </div>
              <div className="overflow-x-auto text-[11px] rounded-lg border border-border bg-card">
                <table className="w-full text-left">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border text-[10px] font-bold">
                    <tr>
                      <th className="py-2 px-2.5">Game</th>
                      <th className="py-2 px-2 text-center">Active</th>
                      <th className="py-2 px-2 text-center">Subs</th>
                      <th className="py-2 px-2 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {TEAM_SPORTS.map((sport) => {
                      const c = TEAM_SPORTS_CONFIG[sport];
                      if (!c) return null;
                      return (
                        <tr key={sport} className="hover:bg-muted/20">
                          <td className="py-1.5 px-2.5 font-medium text-foreground">{sport}</td>
                          <td className="py-1.5 px-2 text-center font-mono">{c.activePlayers}</td>
                          <td className="py-1.5 px-2 text-center font-mono">{c.substitutesAllowed}</td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                            {c.maxPlayers}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tournament Rules / Highlights Card */}
            <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Trophy className="size-3.5 text-amber-500" /> Captain Responsibilities
              </h4>
              <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>The Captain registers the team name and squad roster.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Captain receives schedule alerts, fixture drawings, and match slot timings.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Ensures squad is present at venue 20 minutes before kickoff / toss.</span>
                </li>
              </ul>
            </div>

            {/* Need Help / Contact */}
            <div className="rounded-2xl border border-border bg-card p-5 text-xs space-y-2">
              <h4 className="font-bold text-foreground">Need Assistance?</h4>
              <p className="text-muted-foreground">
                For queries regarding fixture schedules, rules, or squad changes, reach out to the SAAHS Sports Committee.
              </p>
              <div className="pt-2">
                <Link
                  href="/help-desk"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                >
                  Contact Sports Help Desk <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Registered Teams & Squads (Per Sport) ────────────────── */}
        <section className="mt-16 pt-10 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
                <Trophy className="size-3.5" /> Tournament Squads
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Registered Teams <span className="text-amber-500">Per Sport</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Explore the participating teams registered across allied health departments and their captains
              </p>
            </div>
          </div>

          {/* Sport Selector Chips */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TEAM_SPORTS.map((sport) => {
              const group = allTeamsBySport.find((g) => g.sport === sport);
              const count = group?.teams.length || 0;
              const isSelected = activeRosterSport === sport;
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setActiveRosterSport(sport)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{sport}</span>
                  <span className={`text-[10px] rounded-full px-1.5 py-0.2 font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-background text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Teams for the selected sport */}
          {(() => {
            const currentGroup = allTeamsBySport.find((g) => g.sport === activeRosterSport);
            const teams = currentGroup?.teams || [];

            if (teams.length === 0) {
              return (
                <div className="rounded-2xl border border-dashed border-border p-12 text-center bg-card/50">
                  <Trophy className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-foreground">No Teams Registered Yet</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    No teams have registered for {activeRosterSport} yet. Be the first to create a squad as Captain!
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs"
                    onClick={() => {
                      setSelectedTeamSport(activeRosterSport as TeamSport);
                      setRegMode("team");
                      window.scrollTo({ top: 350, behavior: "smooth" });
                    }}
                  >
                    <Plus className="size-3.5 mr-1" /> Create {activeRosterSport} Team
                  </Button>
                </div>
              );
            }

            return (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team, idx) => (
                  <div
                    key={team.id || idx}
                    className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm hover:border-amber-500/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          TEAM #{idx + 1}
                        </span>
                        <h4 className="text-base font-extrabold text-foreground leading-tight">
                          {team.teamName}
                        </h4>
                      </div>
                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        {team.members.length > 0 ? `${team.members.length} Players` : "Team"}
                      </Badge>
                    </div>

                    {/* Captain details */}
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Crown className="size-4 text-amber-500 shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block leading-tight">
                            Team Captain
                          </span>
                          <span className="font-bold text-foreground">
                            {team.captain.name}
                          </span>
                          <span className="text-muted-foreground text-[11px] block">
                            {team.captain.department || "Allied Health Sciences"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Squad Members */}
                    {team.members && team.members.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Squad Members
                        </span>
                        <div className="rounded-lg border border-border divide-y divide-border/60 text-xs bg-muted/20 max-h-40 overflow-y-auto">
                          {team.members.map((member: TeamMember, mIdx: number) => (
                            <div
                              key={mIdx}
                              className="px-3 py-1.5 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                {member.is_captain ? (
                                  <Crown className="size-3 text-amber-500 shrink-0" />
                                ) : (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {mIdx + 1}
                                  </span>
                                )}
                                <span className="font-medium text-foreground">
                                  {member.name}
                                  {member.is_captain && (
                                    <span className="text-[9px] text-amber-600 font-bold ml-1">
                                      (C)
                                    </span>
                                  )}
                                </span>
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {member.roll_number || member.department || "—"}
                              </span>
                            </div>
                          ))}
                        </div>
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
  );
}
