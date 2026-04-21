import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;

export const db = createClient(url, key);

export interface MatchRow {
  match_id: string;
  home_team: string;
  away_team: string;
  home_id: number;
  away_id: number;
  league_id: number;
  league: string;
  kickoff: string; // ISO 8601 with timezone
  pot: string | null; // e.g. "Regular Season - 13"
  league_week_number_pt_br: string | null;
  channels: Array<{ id: string; name: string; logo: string | null; free?: boolean | null }>;
}

interface BroadcastsJson {
  br?: string[];
  [country: string]: string[] | undefined;
}

function parseEnabledLeagueIds(): number[] {
  const raw = process.env.ENABLED_LEAGUE_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
}

export async function fetchUpcomingMatches(): Promise<MatchRow[]> {
  const daysAhead = Number(process.env.DAYS_AHEAD ?? 1);

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + daysAhead);
  to.setHours(23, 59, 59, 999);

  const enabledLeagueIds = parseEnabledLeagueIds();

  let query = db
    .from("matches")
    .select(
      "match_id, league, league_id, home_team, away_team, home_id, away_id, kickoff, broadcasts, pot, league_week_number_pt_br",
    )
    .eq("status", "Not Started")
    .eq("has_broadcasts", true)
    .gte("kickoff", from.toISOString())
    .lte("kickoff", to.toISOString())
    .order("kickoff", { ascending: true });

  if (enabledLeagueIds.length > 0) {
    query = query.in("league_id", enabledLeagueIds);
  }

  const { data: matches, error } = await query;

  if (error) throw error;
  if (!matches || matches.length === 0) return [];

  // Collect all unique BR channel IDs across all matches
  const channelIds = [
    ...new Set(
      matches.flatMap((m) => {
        const b = m.broadcasts as BroadcastsJson | null;
        return b?.br ?? [];
      }),
    ),
  ];

  let channelMap = new Map<string, { id: string; name: string; logo: string | null }>();

  if (channelIds.length > 0) {
    const { data: channels, error: chErr } = await db
      .from("channels_index")
      .select("id, name, logo, free")
      .in("id", channelIds);

    if (chErr) throw chErr;
    channelMap = new Map((channels ?? []).map((c) => [c.id, c]));
  }

  return matches.map((m) => {
    const b = m.broadcasts as BroadcastsJson | null;
    const brIds = b?.br ?? [];
    const channels = brIds
      .map((id) => channelMap.get(id))
      .filter(
        (c): c is { id: string; name: string; logo: string | null; free?: boolean | null } =>
          c != null,
      );

    return {
      match_id: m.match_id,
      home_team: m.home_team,
      away_team: m.away_team,
      home_id: m.home_id,
      away_id: m.away_id,
      league_id: m.league_id,
      league: m.league,
      kickoff: m.kickoff,
      pot: m.pot,
      league_week_number_pt_br: m.league_week_number_pt_br,
      channels,
    };
  });
}

// Requires reel_url and reel_generated_at columns — see migration in ONDEASSISTIR_PLAN.md
export async function saveReelUrl(matchId: string, reelUrl: string): Promise<void> {
  const { error } = await db
    .from("matches")
    .update({
      reel_url: reelUrl,
      reel_generated_at: new Date().toISOString(),
    })
    .eq("match_id", matchId);

  if (error) throw error;
}
