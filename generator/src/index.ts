import "dotenv/config";
import { fetchUpcomingMatches, saveReelUrl, saveLeagueReelUrl } from "./supabase.js";
import type { MatchRow } from "./supabase.js";
import { renderMatch, renderLeagueReel, leagueReelStorageName } from "./render.js";
import { uploadReel } from "./upload.js";

async function run() {
  console.log("[generator] Starting match reel generation...");

  const matches = await fetchUpcomingMatches();

  if (matches.length === 0) {
    console.log("[generator] No upcoming matches with broadcasts found. Done.");
    return;
  }

  // Group matches by league_id
  const byLeague = new Map<number, MatchRow[]>();
  for (const match of matches) {
    const group = byLeague.get(match.league_id) ?? [];
    group.push(match);
    byLeague.set(match.league_id, group);
  }

  const limit = Number(process.env.MAX_RENDERS_PER_RUN ?? 0);
  let jobCount = 0;

  const leagueGroups = [...byLeague.values()];
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
