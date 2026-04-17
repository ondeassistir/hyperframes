import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createRenderJob, executeRenderJob } from "@hyperframes/producer";
import { composeMatchHtml } from "./compose.js";
import type { MatchRow } from "./supabase.js";

export async function renderMatch(match: MatchRow): Promise<string> {
  const html = composeMatchHtml(match);

  // Each match gets its own temp dir (projectDir must contain index.html)
  const projectDir = join(tmpdir(), `hf-reel-${match.match_id}`);
  mkdirSync(projectDir, { recursive: true });
  writeFileSync(join(projectDir, "index.html"), html, "utf-8");

  const outputPath = join(projectDir, "reel.mp4");

  const job = createRenderJob({
    fps: 30,
    quality: "standard",
  });

  await executeRenderJob(job, projectDir, outputPath, (progress) => {
    process.stdout.write(`\r    Rendering... ${Math.round(progress * 100)}%`);
  });

  process.stdout.write("\n");

  return outputPath;
}
