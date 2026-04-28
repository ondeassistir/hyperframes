import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;

export const db = createClient(url, key);

export interface MatchRow {
  match_id: string;
  api_football_id: number;
  home_team: string;
  away_team: string;
  home_team_name: string;
  away_team_name: string;
  home_id: number;
  away_id: number;
  league_id: number;
  league: string;
  league_name: string;
  league_logo_url: string;
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

export interface FetchOptions {
  leagueId?: number;
  date?: string; // YYYY-MM-DD in America/Sao_Paulo timezone
}

export async function fetchUpcomingMatches(opts: FetchOptions = {}): Promise<MatchRow[]> {
  let from: Date;
  let to: Date;

  if (opts.date) {
    // Parse date as BRT (UTC-3) boundaries
    from = new Date(`${opts.date}T00:00:00-03:00`);
    to = new Date(`${opts.date}T23:59:59-03:00`);
  } else {
    const daysAhead = Number(process.env.DAYS_AHEAD ?? 1);
    from = new Date();
    from.setHours(0, 0, 0, 0);
    to = new Date(from);
    to.setDate(to.getDate() + daysAhead);
    to.setHours(23, 59, 59, 999);
  }

  const enabledLeagueIds = opts.leagueId
    ? [opts.leagueId]
    : parseEnabledLeagueIds();

  let query = db
    .from("matches")
    .select(
      "match_id, api_football_id, league, league_id, home_team, away_team, home_id, away_id, kickoff, broadcasts, pot, league_week_number_pt_br",
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

  // Fetch real league names and logos
  const uniqueLeagueIds = [...new Set(matches.map((m) => m.league_id))];
  const { data: leagues, error: lgErr } = await db
    .from("leagues")
    .select("id, name, logo_url")
    .in("id", uniqueLeagueIds);

  if (lgErr) throw lgErr;
  const leagueMap = new Map((leagues ?? []).map((l) => [l.id, l]));

  // Fetch real team names
  const uniqueTeamIds = [...new Set(matches.flatMap((m) => [m.home_id, m.away_id]))];
  const { data: teams, error: tmErr } = await db
    .from("teams_map_full")
    .select("api_football_team_id, team_full_name")
    .in("api_football_team_id", uniqueTeamIds);

  if (tmErr) throw tmErr;
  const teamMap = new Map((teams ?? []).map((t) => [t.api_football_team_id, t.team_full_name]));

  return matches.map((m) => {
    const b = m.broadcasts as BroadcastsJson | null;
    const brIds = b?.br ?? [];
    const channels = brIds
      .map((id) => channelMap.get(id))
      .filter(
        (c): c is { id: string; name: string; logo: string | null; free?: boolean | null } =>
          c != null,
      );

    const leagueData = leagueMap.get(m.league_id);

    return {
      match_id: m.match_id,
      api_football_id: m.api_football_id,
      home_team: m.home_team,
      away_team: m.away_team,
      home_team_name: teamMap.get(m.home_id) ?? m.home_team,
      away_team_name: teamMap.get(m.away_id) ?? m.away_team,
      home_id: m.home_id,
      away_id: m.away_id,
      league_id: m.league_id,
      league: m.league,
      league_name: leagueData?.name ?? m.league,
      league_logo_url: leagueData?.logo_url ?? "",
      kickoff: m.kickoff,
      pot: m.pot,
      league_week_number_pt_br: m.league_week_number_pt_br,
      channels,
    };
  });
}

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

export async function saveLeagueReelUrl(matchIds: string[], reelUrl: string): Promise<void> {
  const { error } = await db
    .from("matches")
    .update({
      reel_url: reelUrl,
      reel_generated_at: new Date().toISOString(),
    })
    .in("match_id", matchIds);

  if (error) throw error;
}
