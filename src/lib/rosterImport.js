import { sb } from "@/lib/supabase";
import { mapRoster } from "@/hooks/useAppData";

export async function fetchEventTeams(eventId) {
  if (!eventId) return [];
  const { data, error } = await sb.from("rosters").select("*").eq("event_id", eventId);
  if (error) {
    console.error("fetchEventTeams error:", error);
    return [];
  }
  return (data || []).map(mapRoster);
}

export async function importTeamsFromEvent({ sourceEventId, targetEventId, teamNames, rosters, setRosters }) {
  const sourceRosters = await fetchEventTeams(sourceEventId);
  const selected = sourceRosters.filter((r) => teamNames.includes(r.team));

  for (const sr of selected) {
    const existing = rosters.find((r) => r.eventId === targetEventId && r.team === sr.team);
    if (existing) {
      const mergedIds = Array.from(new Set([...(existing.memberIds || []), ...(sr.memberIds || [])]));
      const leaderId = existing.leaderId || sr.leaderId || null;
      await sb.from("rosters").update({ member_ids: mergedIds, leader_id: leaderId }).eq("id", existing.id);
      setRosters((prev) =>
        prev.map((r) => (r.id === existing.id ? { ...r, memberIds: mergedIds, leaderId } : r))
      );
    } else {
      const { data } = await sb
        .from("rosters")
        .insert({
          event_id: targetEventId,
          team: sr.team,
          member_ids: sr.memberIds || [],
          leader_id: sr.leaderId || null,
        })
        .select()
        .single();
      if (data) {
        setRosters((prev) => [...prev, mapRoster(data)]);
      }
    }
  }

  return selected.map((r) => r.team);
}
