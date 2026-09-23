"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Users,
  User,
  Crown,
  Download,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Calendar,
  MapPin,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { EventRow, TeamMember } from "@/types/database";
import type { EventRegistrationDetail } from "@/app/actions/admin/event-registrations";
import type { SportTeamGroup } from "@/app/actions/events";

interface Props {
  event: EventRow;
  registrations: EventRegistrationDetail[];
  teamsBySport: SportTeamGroup[];
}

function exportToCSV(registrations: EventRegistrationDetail[], eventTitle: string) {
  const headers = [
    "Name",
    "Roll Number",
    "Department / Course",
    "Batch Year",
    "Phone",
    "Sports / Events",
    "Team Name",
    "Role",
    "Squad Roster",
    "Waiver Accepted",
    "Registered At",
  ];

  const rows = registrations.map((r) => [
    r.profile.full_name ?? "",
    r.profile.roll_number ?? "",
    [r.profile.course, r.profile.department].filter(Boolean).join(" / "),
    r.profile.batch_year ?? "",
    r.phone_number ?? "",
    r.sport_choices.join("; "),
    r.team_name ?? "",
    r.is_captain ? "Captain" : "Participant",
    (r.team_members || []).map((m) => `${m.name}${m.roll_number ? ` (${m.roll_number})` : ""}`).join("; "),
    r.waiver_accepted ? "Yes" : "No",
    new Date(r.registered_at).toLocaleString(),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${eventTitle.replace(/\s+/g, "_")}_registrations.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminEventRegistrationsFullClient({
  event,
  registrations,
  teamsBySport,
}: Props) {
  const [activeTab, setActiveTab] = useState<"teams" | "solo" | "table">("teams");
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Total unique teams created
  const totalTeams = useMemo(() => {
    const names = new Set<string>();
    registrations.forEach((r) => {
      if (r.team_name) names.add(r.team_name);
    });
    return names.size;
  }, [registrations]);

  // Filtered teams per sport
  const filteredTeamSports = useMemo(() => {
    return teamsBySport
      .filter((g) => g.isTeamSport)
      .filter((g) => {
        if (selectedSportFilter === "ALL") return true;
        return g.sport === selectedSportFilter;
      });
  }, [teamsBySport, selectedSportFilter]);

  // Solo sports groups
  const soloSports = useMemo(() => {
    return teamsBySport.filter((g) => !g.isTeamSport);
  }, [teamsBySport]);

  // Filtered table rows
  const filteredTableRows = useMemo(() => {
    if (!searchQuery) return registrations;
    const q = searchQuery.toLowerCase();
    return registrations.filter((r) => {
      return (
        r.profile.full_name?.toLowerCase().includes(q) ||
        r.profile.roll_number?.toLowerCase().includes(q) ||
        r.profile.department?.toLowerCase().includes(q) ||
        r.team_name?.toLowerCase().includes(q) ||
        r.sport_choices.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [registrations, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* ── Top Bar / Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <Link
            href="/dashboard/admin/events"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="size-3.5" /> Back to Events Management
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Registrations — {event.title}
            </h1>
            <Badge className="bg-brand text-brand-foreground text-xs border-none font-semibold">
              <Trophy className="size-3 mr-1" /> {event.category}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-primary" />
              {new Date(event.schedule).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 text-primary" />
              {event.venue}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 font-semibold text-xs"
            onClick={() => exportToCSV(registrations, event.title)}
            disabled={registrations.length === 0}
          >
            <Download className="size-3.5" /> Export All CSV
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Students Registered
          </span>
          <p className="text-2xl font-extrabold text-foreground mt-1">
            {registrations.length}
          </p>
        </div>

        <div className="rounded-xl border border-brand/30 bg-brand/5 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
            Total Squads / Teams Created
          </span>
          <p className="text-2xl font-extrabold text-foreground mt-1">
            {totalTeams}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Active Team Sports
          </span>
          <p className="text-2xl font-extrabold text-foreground mt-1">
            {teamsBySport.filter((g) => g.isTeamSport).length}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Solo Event Categories
          </span>
          <p className="text-2xl font-extrabold text-foreground mt-1">
            {soloSports.length}
          </p>
        </div>
      </div>

      {/* ── View Mode Tabs ──────────────────────────────────────────── */}
      <div className="flex rounded-xl border border-border bg-muted/40 p-1 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("teams")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "teams"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="size-3.5 text-brand" />
          Teams Per Sport ({totalTeams})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("solo")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "solo"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="size-3.5 text-blue-500" />
          Solo Events
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("table")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === "table"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Registrations ({registrations.length})
        </button>
      </div>

      {/* ── TAB 1: TEAMS PER SPORT ──────────────────────────────────── */}
      {activeTab === "teams" && (
        <div className="space-y-6">
          {/* Sport Filter Chips */}
          <div className="flex flex-wrap gap-1.5 pb-2">
            <button
              type="button"
              onClick={() => setSelectedSportFilter("ALL")}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedSportFilter === "ALL"
                  ? "bg-brand text-brand-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All Team Sports
            </button>
            {teamsBySport
              .filter((g) => g.isTeamSport)
              .map((g) => (
                <button
                  key={g.sport}
                  type="button"
                  onClick={() => setSelectedSportFilter(g.sport)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    selectedSportFilter === g.sport
                      ? "bg-brand text-brand-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {g.sport} ({g.teams.length})
                </button>
              ))}
          </div>

          {/* Sports & Their Squads */}
          <div className="space-y-8">
            {filteredTeamSports.map((group) => (
              <div
                key={group.sport}
                className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
              >
                {/* Sport Section Header */}
                <div className="bg-muted/40 px-5 py-3.5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-brand text-brand-foreground font-bold text-xs">
                      <Trophy className="size-3.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {group.sport}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {group.teams.length} team(s) registered
                      </p>
                    </div>
                  </div>
                </div>

                {/* Teams List */}
                <div className="p-5">
                  {group.teams.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground italic">
                      No teams registered for {group.sport} yet.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {group.teams.map((team, idx) => (
                        <div
                          key={team.id || idx}
                          className="rounded-xl border border-brand/30 bg-gradient-to-br from-brand/5 via-card to-background p-4 space-y-3"
                        >
                          {/* Team Header */}
                          <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-bold text-muted-foreground">
                                  #{idx + 1}
                                </span>
                                <h4 className="text-base font-extrabold text-foreground">
                                  {team.teamName}
                                </h4>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                Registered: {new Date(team.registeredAt).toLocaleDateString()}
                              </span>
                            </div>
                            <Badge className="bg-brand text-brand-foreground text-[10px] font-bold border-none">
                              {team.members.length > 0 ? `${team.members.length} Players` : "Team"}
                            </Badge>
                          </div>

                          {/* Captain Info Card */}
                          <div className="rounded-lg border border-border bg-card p-2.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Crown className="size-4 text-brand shrink-0" />
                              <div>
                                <span className="text-[10px] uppercase font-bold text-brand block">
                                  Captain
                                </span>
                                <span className="font-bold text-foreground">
                                  {team.captain.name}
                                </span>
                                <span className="text-muted-foreground text-[11px] block">
                                  {team.captain.department || "Allied Health Sciences"}
                                  {team.captain.rollNumber && ` · Roll #${team.captain.rollNumber}`}
                                </span>
                              </div>
                            </div>
                            {team.captain.phone && (
                              <a
                                href={`tel:${team.captain.phone}`}
                                className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline shrink-0 ml-2"
                              >
                                <Phone className="size-3" /> {team.captain.phone}
                              </a>
                            )}
                          </div>

                          {/* Squad Roster */}
                          {team.members && team.members.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                                Squad Roster
                              </span>
                              <div className="rounded-lg border border-border/60 divide-y divide-border/40 text-xs bg-background/50 max-h-36 overflow-y-auto">
                                {team.members.map((member: TeamMember, mIdx: number) => (
                                  <div
                                    key={mIdx}
                                    className="px-3 py-1.5 flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      {member.is_captain ? (
                                        <Crown className="size-3 text-brand shrink-0" />
                                      ) : (
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                          {mIdx + 1}
                                        </span>
                                      )}
                                      <span className="font-medium text-foreground">
                                        {member.name}
                                        {member.is_captain && (
                                          <span className="text-[9px] text-brand font-bold ml-1">
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
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: SOLO EVENTS ──────────────────────────────────────── */}
      {activeTab === "solo" && (
        <div className="grid gap-6 md:grid-cols-2">
          {soloSports.map((group) => (
            <div
              key={group.sport}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
            >
              <div className="bg-muted/40 px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {group.sport}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {group.soloParticipants.length} participant(s)
                </Badge>
              </div>

              <div className="p-4">
                {group.soloParticipants.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-3 text-center">
                    No individual registrations yet.
                  </p>
                ) : (
                  <div className="divide-y divide-border/60 text-xs">
                    {group.soloParticipants.map((p, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.department || "Allied Health"} {p.rollNumber && `· #${p.rollNumber}`}
                          </p>
                        </div>
                        {p.phone && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {p.phone}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: FLAT REGISTRATIONS TABLE ─────────────────────────── */}
      {activeTab === "table" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, roll no, team, sport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Showing {filteredTableRows.length} of {registrations.length} registrations
            </span>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs font-semibold py-2">#</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Name</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Roll No.</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Dept / Course</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Team / Squad</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Phone</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Sports</TableHead>
                  <TableHead className="text-xs font-semibold py-2 text-center">Waiver</TableHead>
                  <TableHead className="text-xs font-semibold py-2">Registered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTableRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-xs text-muted-foreground">
                      No registrations match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTableRows.map((reg, idx) => (
                    <TableRow key={reg.id} className="hover:bg-muted/20">
                      <TableCell className="py-2 text-xs text-muted-foreground font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="py-2 text-xs font-medium">
                        {reg.profile.full_name ?? "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground font-mono">
                        {reg.profile.roll_number ?? "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground">
                        {reg.profile.course || reg.profile.department || "—"}
                      </TableCell>
                      <TableCell className="py-2 text-xs">
                        {reg.team_name ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-foreground">
                              {reg.team_name}
                            </span>
                            <div className="flex items-center gap-1">
                              {reg.is_captain && (
                                <Badge className="text-[8px] px-1 py-0 bg-brand text-brand-foreground font-bold border-none">
                                  <Crown className="size-2 mr-0.5" /> Captain
                                </Badge>
                              )}
                              {reg.team_members && reg.team_members.length > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  {reg.team_members.length} players
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Solo</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground font-mono">
                        {reg.phone_number ?? "—"}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-0.5 max-w-[160px]">
                          {reg.sport_choices.map((s) => (
                            <Badge
                              key={s}
                              className="text-[9px] px-1.5 py-0 bg-brand/10 text-brand border border-brand/30"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        {reg.waiver_accepted ? (
                          <CheckCircle2 className="size-3.5 text-emerald-600 mx-auto" />
                        ) : (
                          <XCircle className="size-3.5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap font-mono">
                        {new Date(reg.registered_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
