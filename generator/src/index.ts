import "dotenv/config";
import { fetchUpcomingMatches, saveReelUrl } from "./supabase.js";
import { renderMatch } from "./render.js";
import { uploadReel } from "./upload.js";

async function run() {
  console.log("[generator] Starting match reel generation...");

  const matches = await fetchUpcomingMatches();

  if (matches.length === 0) {
    console.log("[generator] No upcoming matches with broadcasts found. Done.");
    return;
  }

  const limit = Number(process.env.MAX_RENDERS_PER_RUN ?? 0);
  const batch = limit > 0 ? matches.slice(0, limit) : matches;

  if (limit > 0 && matches.length > limit) {
    console.log(`[generator] Found ${matches.length} match(es); capped to ${limit} this run (MAX_RENDERS_PER_RUN=${limit}).\n`);
  } else {
    console.log(`[generator] Found ${batch.length} match(es) to render.\n`);
  }

  let rendered = 0;
  let failed = 0;

  for (const match of batch) {
    const label = `${match.home_team} x ${match.away_team}`;
    console.log(`→ ${label}  (${match.kickoff})`);

    try {
      const videoPath = await renderMatch(match);

      process.stdout.write("    Uploading...");
      const reelUrl = await uploadReel(match.match_id, videoPath);
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
  }

  console.log(`[generator] Finished. ${rendered} rendered, ${failed} failed.`);
}

run().catch((err) => {
  console.error("[generator] Fatal error:", err);
  process.exit(1);
});
