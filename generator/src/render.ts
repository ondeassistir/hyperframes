import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createRenderJob, executeRenderJob } from "@hyperframes/producer";
import { composeMatchHtml, composeLeagueReelHtml } from "./compose.js";
import type { MatchRow } from "./supabase.js";

async function renderHtml(html: string, outDir: string): Promise<string> {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html, "utf-8");

  const outputPath = join(outDir, "reel.mp4");

  const job = createRenderJob({
    fps: 30,
    quality: "standard",
    workers: 1,
  });

  await executeRenderJob(job, outDir, outputPath, (progress) => {
    process.stdout.write(`\r    Rendering... ${Math.round(progress * 100)}%`);
  });

  process.stdout.write("\n");

  return outputPath;
}

export async function renderMatch(match: MatchRow): Promise<string> {
  const html = composeMatchHtml(match);
  const outDir = join(tmpdir(), `hf-reel-${match.api_football_id}`);
  return renderHtml(html, outDir);
}

export async function renderLeagueReel(matches: MatchRow[]): Promise<string> {
  const html = composeLeagueReelHtml(matches);
  const ids = matches.map((m) => m.api_football_id).join("-");
  const outDir = join(tmpdir(), `hf-reel-league-${matches[0].league_id}-${ids}`);
  return renderHtml(html, outDir);
}

export function leagueReelStorageName(leagueId: number, matches: MatchRow[]): string {
  const ids = matches.map((m) => m.api_football_id).join("-");
  return `${leagueId}-${ids}.mp4`;
}
