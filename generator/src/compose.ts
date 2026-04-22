import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { MatchRow } from "./supabase.js";

const __dir = dirname(fileURLToPath(import.meta.url));

const templateHtml = readFileSync(join(__dir, "templates/match-reel.html"), "utf-8");
const leagueReelTemplateHtml = readFileSync(join(__dir, "templates/league-reel.html"), "utf-8");

const CDN = "https://imagedelivery.net/d9gC2EGekkZoINfC-sskXg";
const APP_ICON_URL = `${CDN}/ui/ic_launcher-playstore-reel.png/public`;
const GPLAY_BADGE_URL = `${CDN}/ui/googleplay-badge.svg/public`;
const OA_LOGO_URL = `${CDN}/ui/logo-roxo.svg/public`;
const OA_FAVICON_URL = "https://img.ondeassistir.tv/images-scr/favicon/favicon.svg";

export function teamLogoUrl(teamId: number): string {
  return `${CDN}/teams/${teamId}.png/public`;
}

export function leagueLogoUrl(leagueId: number): string {
  return `${CDN}/leagues/${leagueId}.png/public`;
}

export function leagueBgUrl(leagueId: number): string {
  return `${CDN}/ui/reels/league_bg/${leagueId}.jpg/public`;
}

export function composeMatchHtml(match: MatchRow): string {
  const kickoff = new Date(match.kickoff);

  const kickoffDate = kickoff.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Sao_Paulo",
  });

  const kickoffTime =
    kickoff.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }) + "h";

  const round = formatRound(match);

  const channelsHtml = buildChannelsHtml(match.channels);

  return templateHtml
    .replaceAll("{{HOME_TEAM}}", escapeHtml(match.home_team))
    .replaceAll("{{AWAY_TEAM}}", escapeHtml(match.away_team))
    .replaceAll("{{HOME_LOGO_URL}}", teamLogoUrl(match.home_id))
    .replaceAll("{{AWAY_LOGO_URL}}", teamLogoUrl(match.away_id))
    .replaceAll("{{LEAGUE_LOGO_URL}}", leagueLogoUrl(match.league_id))
    .replaceAll("{{LEAGUE_BG_URL}}", leagueBgUrl(match.league_id))
    .replaceAll("{{LEAGUE_NAME}}", escapeHtml(match.league))
    .replaceAll("{{ROUND}}", escapeHtml(round))
    .replaceAll("{{KICKOFF_DATE}}", capitalize(kickoffDate))
    .replaceAll("{{KICKOFF_TIME}}", kickoffTime)
    .replaceAll("{{CHANNELS_HTML}}", channelsHtml);
}

// ── Multi-match league reel ────────────────────────────────────────────────

const MATCH_SCENE_DURATION = 8;
const PUSH_DURATION = 0.5;
const FOLLOW_DURATION = 4.5;

export function composeLeagueReelHtml(matches: MatchRow[]): string {
  const totalDuration =
    2 +
    matches.length * MATCH_SCENE_DURATION +
    (matches.length - 1) * PUSH_DURATION +
    FOLLOW_DURATION;

  const scenesHtml = [
    buildIntroSceneHtml(),
    ...matches.map((m, i) => buildMatchSceneHtml(m, i)),
    buildFollowSceneHtml(),
  ].join("\n");

  const gsapScript = buildLeagueReelGsapScript(matches);

  return leagueReelTemplateHtml
    .replaceAll("{{LEAGUE_NAME}}", escapeHtml(matches[0].league))
    .replaceAll("{{COMPOSITION_DURATION}}", String(Math.ceil(totalDuration)))
    .replaceAll("{{SCENES_HTML}}", scenesHtml)
    .replaceAll("{{GSAP_SCRIPT}}", gsapScript);
}

function buildIntroSceneHtml(): string {
  return `
      <div id="scene-intro" class="scene" style="z-index:2">
        <div class="scene-bg"></div>
        <div class="intro-center">
          <img id="oa-logo-intro" src="${OA_LOGO_URL}" alt="Onde Assistir" />
          <p id="tagline-intro">Onde Assistir Futebol Ao Vivo</p>
        </div>
      </div>`;
}

function buildMatchSceneHtml(match: MatchRow, index: number): string {
  const kickoff = new Date(match.kickoff);
  const kickoffDate = capitalize(
    kickoff.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Sao_Paulo",
    }),
  );
  const kickoffTime =
    kickoff.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }) + "h";
  const round = formatRound(match);
  const channelsHtml = buildChannelsHtml(match.channels);

  return `
      <div id="scene-match-${index}" class="scene scene-match" style="z-index:1;opacity:0">
        <img class="league-bg" src="${leagueBgUrl(match.league_id)}" alt="" />
        <div class="scene-bg"></div>
        <div class="layout">
          <div class="league-row">
            <img class="league-logo" src="${leagueLogoUrl(match.league_id)}" alt="Liga" />
            <div class="league-info">
              <span class="league-name-el">${escapeHtml(match.league)}</span>
              <span class="round-label">${escapeHtml(round)}</span>
            </div>
            <img class="app-icon" src="${APP_ICON_URL}" alt="" />
          </div>
          <div class="home-row">
            <img class="home-logo" src="${teamLogoUrl(match.home_id)}" alt="${escapeHtml(match.home_team)}" />
            <span class="home-name">${escapeHtml(match.home_team)}</span>
          </div>
          <div class="away-row">
            <img class="away-logo" src="${teamLogoUrl(match.away_id)}" alt="${escapeHtml(match.away_team)}" />
            <span class="away-name">${escapeHtml(match.away_team)}</span>
          </div>
          <div class="divider-rule"></div>
          <span class="kickoff-time">${kickoffTime}</span>
          <span class="kickoff-date">${kickoffDate}</span>
          <div class="divider-rule-2"></div>
          <span class="channels-label">Onde Assistir Ao Vivo</span>
          <div class="channels-list">${channelsHtml}</div>
          <div class="app-cta">
            <span class="cta-text">Baixe o app! 100% Grátis</span>
            <img class="gplay-badge" src="${GPLAY_BADGE_URL}" alt="Disponível no Google Play" />
          </div>
        </div>
        <div class="oa-footer">
          <img class="footer-logo-img" src="${OA_FAVICON_URL}" alt="Onde Assistir" />
          <span class="footer-domain">www.ondeassistir.tv</span>
        </div>
      </div>`;
}

function buildFollowSceneHtml(): string {
  return `
      <div id="scene-follow" class="scene" style="z-index:1;opacity:0">
        <div class="scene-bg"></div>
        <div id="follow-card">
          <img id="follow-avatar" src="${OA_FAVICON_URL}" alt="Onde Assistir" />
          <div id="follow-info">
            <span id="follow-name">Onde Assistir</span>
            <span id="follow-handle">@roxo.app.br</span>
          </div>
          <button id="follow-btn">
            <span class="btn-label" id="btn-follow">Seguir</span>
            <span class="btn-label" id="btn-following">Seguindo ✓</span>
          </button>
        </div>
      </div>`;
}

function buildLeagueReelGsapScript(matches: MatchRow[]): string {
  // Time at which each match scene becomes fully visible
  const matchSceneTimes: number[] = [2.0];
  for (let i = 1; i < matches.length; i++) {
    matchSceneTimes.push(matchSceneTimes[i - 1] + MATCH_SCENE_DURATION + PUSH_DURATION);
  }
  const followStart = matchSceneTimes[matches.length - 1] + MATCH_SCENE_DURATION;

  const lines: string[] = [];

  // ── Phase 1: Intro ──
  lines.push(
    `tl.set("#oa-logo-intro", { rotationY: -90, opacity: 0, transformPerspective: 600 }, 0);`,
    `tl.to("#oa-logo-intro", { rotationY: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.15);`,
    `tl.fromTo("#tagline-intro", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.7);`,
    `tl.to("#oa-logo-intro, #tagline-intro", { opacity: 0, duration: 0.25, ease: "power2.in" }, 1.25);`,
  );

  // ── Whip pan intro → match 0 ──
  const T = 1.8;
  lines.push(
    ``,
    `// Whip to match 1`,
    `tl.set("#scene-match-0", { opacity: 1, x: 220, filter: "blur(40px)", zIndex: 3 }, ${T});`,
    `tl.to("#scene-match-0", { x: 0, filter: "blur(0px)", duration: 0.2, ease: "power3.out" }, ${T + 0.04});`,
    `tl.set("#scene-intro", { opacity: 0 }, ${T + 0.5});`,
    `tl.to("#scene-match-0 .league-bg", { opacity: 1, duration: 0.9, ease: "power2.out" }, ${T + 0.1});`,
  );
  lines.push(...matchContentLines("#scene-match-0", T + 0.1));

  // ── Push transitions between matches ──
  for (let i = 1; i < matches.length; i++) {
    const pushStart = matchSceneTimes[i - 1] + MATCH_SCENE_DURATION;
    const sid = `#scene-match-${i}`;
    lines.push(
      ``,
      `// Push to match ${i + 1}`,
      `tl.set("${sid}", { opacity: 1, x: 1080, zIndex: 3 }, ${pushStart});`,
      `tl.to("#scene-match-${i - 1}", { x: -1080, duration: ${PUSH_DURATION}, ease: "power3.inOut" }, ${pushStart});`,
      `tl.to("${sid}", { x: 0, duration: ${PUSH_DURATION}, ease: "power3.inOut" }, ${pushStart});`,
      `tl.to("${sid} .league-bg", { opacity: 1, duration: 0.9, ease: "power2.out" }, ${pushStart + 0.1});`,
    );
    lines.push(...matchContentLines(sid, pushStart + 0.25));
  }

  // ── Instagram follow ──
  lines.push(
    ``,
    `// Instagram follow CTA`,
    `tl.set("#scene-follow", { opacity: 1, zIndex: 4 }, ${followStart});`,
    `tl.set("#follow-card", { y: 300, opacity: 0 }, ${followStart});`,
    `tl.to("#follow-card", { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, ${followStart + 0.1});`,
    `tl.to("#follow-btn", { scale: 0.92, duration: 0.15, ease: "power2.out" }, ${followStart + 1.0});`,
    `tl.to("#follow-btn", { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" }, ${followStart + 1.15});`,
    `tl.to("#follow-btn", { backgroundColor: "hsl(215 28% 18%)", duration: 0.12, ease: "none" }, ${followStart + 1.15});`,
    `tl.to("#btn-follow", { opacity: 0, duration: 0.08, ease: "none" }, ${followStart + 1.15});`,
    `tl.to("#btn-following", { opacity: 1, duration: 0.08, ease: "none" }, ${followStart + 1.23});`,
    `tl.to("#follow-card", { y: 300, opacity: 0, duration: 0.25, ease: "power3.in" }, ${followStart + FOLLOW_DURATION - 0.5});`,
  );

  // ── Breathe on each match scene's bg ──
  for (let i = 0; i < matches.length; i++) {
    const breatheStart =
      i === 0 ? T + 0.1 + 2.4 : matchSceneTimes[i] + 0.25 + 2.4;
    lines.push(
      `tl.to("#scene-match-${i} .scene-bg", { scale: 1.06, duration: 3.5, ease: "sine.inOut", yoyo: true, repeat: -1 }, ${breatheStart.toFixed(2)});`,
    );
  }

  return lines.join("\n  ");
}

function matchContentLines(sceneId: string, S: number): string[] {
  return [
    `tl.set("${sceneId} .divider-rule, ${sceneId} .divider-rule-2", { scaleX: 0, transformOrigin: "left center" }, 0);`,
    `tl.fromTo("${sceneId} .league-row", { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" }, ${S.toFixed(2)});`,
    `tl.fromTo("${sceneId} .home-row", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, ${(S + 0.2).toFixed(2)});`,
    `tl.fromTo("${sceneId} .away-row", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, ${(S + 0.32).toFixed(2)});`,
    `tl.to("${sceneId} .divider-rule", { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, ${(S + 0.45).toFixed(2)});`,
    `tl.fromTo("${sceneId} .kickoff-time", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, ${(S + 0.65).toFixed(2)});`,
    `tl.fromTo("${sceneId} .kickoff-date", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, ${(S + 0.9).toFixed(2)});`,
    `tl.to("${sceneId} .divider-rule-2", { scaleX: 1, duration: 0.4, ease: "power2.inOut" }, ${(S + 1.1).toFixed(2)});`,
    `tl.fromTo("${sceneId} .channels-label", { x: -25, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: "power2.out" }, ${(S + 1.25).toFixed(2)});`,
    `tl.fromTo("${sceneId} .channel-item", { x: -35, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35, ease: "power2.out" }, ${(S + 1.4).toFixed(2)});`,
    `tl.fromTo("${sceneId} .app-cta", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }, ${(S + 2.1).toFixed(2)});`,
    `tl.fromTo("${sceneId} .oa-footer", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "sine.out" }, ${(S + 2.4).toFixed(2)});`,
  ];
}

// ── Shared helpers ─────────────────────────────────────────────────────────

function buildChannelsHtml(
  channels: MatchRow["channels"],
): string {
  return channels
    .map((ch) => {
      const badge = ch.free ? `<span class="free-badge">Grátis</span>` : "";
      const logo = ch.logo
        ? `<img src="${ch.logo}" alt="${escapeHtml(ch.name)}" class="channel-logo" />`
        : "";
      return `<div class="channel-item">${logo}<span class="channel-name">${escapeHtml(ch.name)}</span>${badge}</div>`;
    })
    .join("\n        ");
}

function formatRound(match: MatchRow): string {
  if (match.league_week_number_pt_br) return match.league_week_number_pt_br;
  if (match.pot) {
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
