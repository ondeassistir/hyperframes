import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { MatchRow } from "./supabase.js";

const __dir = dirname(fileURLToPath(import.meta.url));

const templateHtml = readFileSync(join(__dir, "templates/match-reel.html"), "utf-8");

const CDN = "https://imagedelivery.net/d9gC2EGekkZoINfC-sskXg";

export function teamLogoUrl(teamId: number): string {
  return `${CDN}/teams/${teamId}.png/public`;
}

export function leagueLogoUrl(leagueId: number): string {
  return `${CDN}/leagues/${leagueId}.png/public`;
}

export function composeMatchHtml(match: MatchRow): string {
  const kickoff = new Date(match.kickoff);

  const kickoffDate = kickoff.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });

  const kickoffTime = kickoff.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  const round = formatRound(match);

  const channelsHtml = match.channels
    .map((ch) => {
      if (ch.logo) {
        return `<div class="channel-item"><img src="${ch.logo}" alt="${escapeHtml(ch.name)}" class="channel-logo" /></div>`;
      }
      return `<div class="channel-item"><span class="channel-name">${escapeHtml(ch.name)}</span></div>`;
    })
    .join("\n        ");

  return templateHtml
    .replaceAll("{{HOME_TEAM}}", escapeHtml(match.home_team))
    .replaceAll("{{AWAY_TEAM}}", escapeHtml(match.away_team))
    .replaceAll("{{HOME_LOGO_URL}}", teamLogoUrl(match.home_id))
    .replaceAll("{{AWAY_LOGO_URL}}", teamLogoUrl(match.away_id))
    .replaceAll("{{LEAGUE_LOGO_URL}}", leagueLogoUrl(match.league_id))
    .replaceAll("{{ROUND}}", escapeHtml(round))
    .replaceAll("{{KICKOFF_DATE}}", capitalize(kickoffDate))
    .replaceAll("{{KICKOFF_TIME}}", kickoffTime)
    .replaceAll("{{CHANNELS_HTML}}", channelsHtml);
}

function formatRound(match: MatchRow): string {
  if (match.league_round_translated) return match.league_round_translated;
  if (match.pot) {
    // "Regular Season - 13" → "Rodada 13"
    const m = match.pot.match(/Regular Season\s*-\s*(\d+)/i);
    if (m) return `Rodada ${m[1]}`;
    return match.pot;
  }
  return "";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
