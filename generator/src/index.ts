import "dotenv/config";
import { fetchUpcomingMatches, saveReelUrl, saveLeagueReelUrl } from "./supabase.js";
import type { MatchRow } from "./supabase.js";
import { renderMatch, renderLeagueReel, leagueReelStorageName } from "./render.js";
import { uploadReel } from "./upload.js";

function parseCliArgs() {
  const args = process.argv.slice(2);
  let leagueId: number | undefined;
  let date: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--league" && args[i + 1]) leagueId = Number(args[++i]);
    if (args[i] === "--date" && args[i + 1]) date = args[++i];
  }
  if (leagueId !== undefined && Number.isNaN(leagueId)) {
    console.error("[generator] --league must be a numeric league ID");
    process.exit(1);
  }
  if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error("[generator] --date must be in YYYY-MM-DD format");
    process.exit(1);
  }
  return { leagueId, date };
}

async function run() {
  const { leagueId, date } = parseCliArgs();

  const modeDesc = [
    leagueId ? `league=${leagueId}` : null,
    date ? `date=${date}` : null,
  ].filter(Boolean).join(", ");

  console.log(`[generator] Starting match reel generation${modeDesc ? ` (${modeDesc})` : ""}...`);

  const matches = await fetchUpcomingMatches({ leagueId, date });

  if (matches.length === 0) {
    console.log("[generator] No upcoming matches with broadcasts found. Done.");
    return;
  }

  // Group matches by league_id + local date (America/Sao_Paulo)
  const byLeagueDay = new Map<string, MatchRow[]>();
  for (const match of matches) {
    const localDate = new Date(match.kickoff).toLocaleDateString("sv", {
      timeZone: "America/Sao_Paulo",
    }); // "YYYY-MM-DD"
    const key = `${match.league_id}::${localDate}`;
    const group = byLeagueDay.get(key) ?? [];
    group.push(match);
    byLeagueDay.set(key, group);
  }

  const limit = Number(process.env.MAX_RENDERS_PER_RUN ?? 0);
  let jobCount = 0;

  const leagueGroups = [...byLeagueDay.values()];
  const totalJobs = leagueGroups.length;

  if (limit > 0 && totalJobs > limit) {
    console.log(`[generator] Found ${totalJobs} league group(s); capped to ${limit} this run (MAX_RENDERS_PER_RUN=${limit}).\n`);
  } else {
    console.log(`[generator] Found ${totalJobs} league group(s) to render.\n`);
  }

  let rendered = 0;
  let failed = 0;

  for (const leagueMatches of leagueGroups) {
    if (limit > 0 && jobCount >= limit) break;
    jobCount++;

    const leagueId = leagueMatches[0].league_id;
    const isSingle = leagueMatches.length === 1;

    if (isSingle) {
      const match = leagueMatches[0];
      const label = `${match.home_team} x ${match.away_team}`;
      console.log(`→ [single] ${match.league} — ${label}  (${match.kickoff})`);

      try {
        const videoPath = await renderMatch(match);

        process.stdout.write("    Uploading...");
        const storagePath = leagueReelStorageName(leagueId, [match]);
        const reelUrl = await uploadReel(match.match_id, videoPath, storagePath);
        console.log(" done.");

        process.stdout.write("    Saving to DB...");
        await saveReelUrl(match.match_id, reelUrl);
        console.log(" done.");

        console.log(`    ✓ ${reelUrl}\n`);
        rendered++;
      } catch (err) {
        console.error(`    ✗ Failed for ${match.match_id}:`, err, "\n");
        failed++;
      }
    } else {
      const labels = leagueMatches.map((m) => `${m.home_team} x ${m.away_team}`).join(", ");
      console.log(`→ [multi ×${leagueMatches.length}] ${leagueMatches[0].league} — ${labels}`);

      try {
        const videoPath = await renderLeagueReel(leagueMatches);

        process.stdout.write("    Uploading...");
        const storagePath = leagueReelStorageName(leagueId, leagueMatches);
        const reelUrl = await uploadReel(storagePath, videoPath, storagePath);
        console.log(" done.");

        process.stdout.write("    Saving to DB...");
        await saveLeagueReelUrl(leagueMatches.map((m) => m.match_id), reelUrl);
        console.log(" done.");

        console.log(`    ✓ ${reelUrl}\n`);
        rendered++;
      } catch (err) {
        console.error(`    ✗ Failed for league ${leagueId}:`, err, "\n");
        failed++;
      }
    }
  }

  console.log(`[generator] Finished. ${rendered} rendered, ${failed} failed.`);
}

run().catch((err) => {
  console.error("[generator] Fatal error:", err);
  process.exit(1);
});
