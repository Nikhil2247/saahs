import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { getEventRegistrations } from "@/app/actions/admin/event-registrations";
import { getEventTeamsBySport, type SportTeamGroup } from "@/app/actions/events";
import { getMehfilGroupsByEvent } from "@/app/actions/vibe-mehfil";
import { AdminEventRegistrationsFullClient } from "./event-registrations-full-client";
import type { EventRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminEventRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = parseInt(id, 10);
  if (isNaN(eventId)) notFound();

  const session = await getSession();
  if (!session) notFound();

  const supabase = createSupabaseAdminClient();

  // Fetch event
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle();

  if (eventErr || !event) notFound();

  // Vibe-e-Mehfil (Kaleidoscope) uses its own event list — solo vs. team
  // events are grouped from lib/vibe-mehfil-constants, not sports-constants.
  const isMehfilEvent = (event as EventRow).title.includes("Vibe-e-Mehfil");

  // Fetch registrations and teams grouped per sub-event
  const [regsRes, teamsRes] = await Promise.all([
    getEventRegistrations(eventId),
    isMehfilEvent ? getMehfilGroupsByEvent(eventId) : getEventTeamsBySport(eventId),
  ]);

  const teamsBySport: SportTeamGroup[] = isMehfilEvent
    ? (teamsRes.data || []).map((g: any) => ({
        sport: g.event,
        isTeamSport: g.isTeamEvent,
        teams: g.teams,
        soloParticipants: g.soloParticipants,
      }))
    : (teamsRes.data as SportTeamGroup[] | undefined) || [];

  return (
    <div className="dashboard-container">
      <AdminEventRegistrationsFullClient
        event={event as EventRow}
        registrations={regsRes.data || []}
        teamsBySport={teamsBySport}
      />
    </div>
  );
}
