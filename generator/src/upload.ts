import { readFileSync } from "fs";
import { db } from "./supabase.js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "match-reels";

export async function uploadReel(matchId: string, filePath: string, storagePath?: string): Promise<string> {
  const buffer = readFileSync(filePath);
  const path = storagePath ? `reels/${storagePath}` : `reels/${matchId}.mp4`;

  const { error } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType: "video/mp4",
    upsert: true,
  });

  if (error) throw error;

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
