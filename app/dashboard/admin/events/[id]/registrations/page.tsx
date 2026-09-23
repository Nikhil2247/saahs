import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { getEventRegistrations } from "@/app/actions/admin/event-registrations";
import { getEventTeamsBySport } from "@/app/actions/events";
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

  // Fetch registrations and teams by sport
  const [regsRes, teamsRes] = await Promise.all([
    getEventRegistrations(eventId),
    getEventTeamsBySport(eventId),
  ]);

  return (
    <div className="dashboard-container">
      <AdminEventRegistrationsFullClient
        event={event as EventRow}
        registrations={regsRes.data || []}
        teamsBySport={teamsRes.data || []}
      />
    </div>
  );
}
