import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

const templateHtml = readFileSync(join(__dir, "templates/match-reel.html"), "utf-8");

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_logo_url: string;
  away_logo_url: string;
  kickoff_at: string; // ISO 8601 UTC timestamp
  round: string; // e.g. "Rodada 12"
  channels: string[]; // e.g. ["Globo", "SporTV", "Cazé TV"]
}

export function composeMatchHtml(match: Match): string {
  const kickoff = new Date(match.kickoff_at);

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

  const channelsHtml = match.channels
    .map((ch) => `<span class="channel-badge">${escapeHtml(ch)}</span>`)
    .join("\n        ");

  return templateHtml
    .replaceAll("{{HOME_TEAM}}", escapeHtml(match.home_team))
    .replaceAll("{{AWAY_TEAM}}", escapeHtml(match.away_team))
    .replaceAll("{{HOME_LOGO_URL}}", match.home_logo_url)
    .replaceAll("{{AWAY_LOGO_URL}}", match.away_logo_url)
    .replaceAll("{{ROUND}}", escapeHtml(match.round))
    .replaceAll("{{KICKOFF_DATE}}", capitalize(kickoffDate))
    .replaceAll("{{KICKOFF_TIME}}", kickoffTime)
    .replaceAll("{{CHANNELS_HTML}}", channelsHtml);
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
