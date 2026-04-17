# OndeAssistir — Automated Match Video Generation Plan

> **Goal:** Automatically generate Instagram Reels (1080×1920) for soccer matches daily,
> using Supabase match data, OndeAssistir branding, and HyperFrames as the rendering engine.
> Hosted on Render.com as a cron job; videos stored in Supabase Storage.

---

## Checklist Legend

- [ ] Not started
- [~] In progress
- [x] Done

---

## Phase 1 — Local Foundation

Get the repo running locally and confirm the renderer works end-to-end.

### 1.1 Prerequisites

- [ ] Install [Bun](https://bun.sh) (`curl -fsSL https://bun.sh/install | bash`)
- [ ] Install [Chromium / Chrome](https://www.google.com/chrome/) (required by HyperFrames engine)
- [ ] Install [FFmpeg](https://ffmpeg.org/download.html)
  - macOS: `brew install ffmpeg`
  - Ubuntu/Debian: `sudo apt install ffmpeg`
- [ ] Verify with: `bun --version`, `ffmpeg -version`, `google-chrome --version` (or `chromium --version`)

### 1.2 Clone & Install

```bash
git clone https://github.com/ondeassistir/hyperframes.git
cd hyperframes
bun install
```

### 1.3 Smoke-test the renderer

```bash
# Build all packages
bun run build

# Render a built-in example to confirm everything works
npx tsx packages/cli/src/cli.ts init my-test --example warm-grain
cd my-test
npx tsx ../packages/cli/src/cli.ts render
```

- [ ] A `.mp4` file is created inside `my-test/` with no errors
- [ ] Check `my-test/` can be deleted after test (`cd .. && rm -rf my-test`)

---

## Phase 2 — Brand System

Apply OndeAssistir identity to HyperFrames compositions.

### 2.1 Add style guide to repo

- [ ] Create `/OndeAssistir_Style_Guide.md` in repo root (you add this)
- [ ] Confirm it documents at minimum:
  - Primary / secondary / accent hex colors
  - Font names (+ whether they are Google Fonts, custom TTF/WOFF, or Adobe)
  - Logo file format (SVG preferred)
  - Corner radius, spacing, shadow preferences if any

### 2.2 Add brand assets

```
generator/
  assets/
    logo.svg          ← OndeAssistir logo (light variant)
    logo-dark.svg     ← Dark/inverted variant (if exists)
    fonts/            ← Any custom TTF/WOFF files
```

- [ ] Place logo SVG(s) in `generator/assets/`
- [ ] Place any custom font files in `generator/assets/fonts/`

### 2.3 Create brand CSS tokens

Create `generator/src/brand.css` — this file will be injected into every composition:

```css
/* generator/src/brand.css */
:root {
  /* Replace with values from OndeAssistir_Style_Guide.md */
  --brand-primary: #REPLACE_ME; /* main brand color */
  --brand-secondary: #REPLACE_ME; /* secondary */
  --brand-accent: #REPLACE_ME; /* CTA / highlight */
  --brand-bg: #REPLACE_ME; /* background */
  --brand-text: #REPLACE_ME; /* body text */
  --brand-text-inv: #REPLACE_ME; /* text on dark bg */

  --brand-font-display: "REPLACE_ME", sans-serif;
  --brand-font-body: "REPLACE_ME", sans-serif;
  --brand-radius: 8px;
}
```

- [ ] Fill in values from style guide
- [ ] Verify fonts load (Google Fonts via `@import` or local via `@font-face`)

### 2.4 Pick catalog blocks for match cards

Browse https://hyperframes.heygen.com/catalog/blocks/ and decide which block(s)
to adapt for match cards. Likely candidates:

| Block           | Use case                        |
| --------------- | ------------------------------- |
| `logo-outro`    | End card with OndeAssistir logo |
| `data-chart`    | Stats/standings if needed       |
| Social overlays | Quick team name + kickoff badge |

- [ ] Install chosen blocks:
  ```bash
  npx tsx packages/cli/src/cli.ts add <block-name>
  ```
- [ ] Note chosen block names here: **\*\***\_**\*\***

---

## Phase 3 — Match Composition Template

Build the HTML composition that takes match data and produces a Reel frame.

### 3.1 Scaffold the generator package

```bash
mkdir -p generator/src/templates
```

Create `generator/package.json`:

```json
{
  "name": "@ondeassistir/generator",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "@hyperframes/producer": "workspace:*",
    "@hyperframes/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsx": "^4"
  }
}
```

- [ ] Run `bun install` from repo root to link workspace packages

### 3.2 Create the match card HTML template

Create `generator/src/templates/match-reel.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, initial-scale=1" />
    <title>{{HOME_TEAM}} vs {{AWAY_TEAM}}</title>
    <link rel="stylesheet" href="../brand.css" />
    <style>
      body {
        width: 1080px;
        height: 1920px;
        background: var(--brand-bg);
        font-family: var(--brand-font-body);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0;
        overflow: hidden;
      }
      /* Add match card layout here after branding is confirmed */
    </style>
  </head>
  <body data-duration="10" data-fps="30" data-width="1080" data-height="1920">
    <!-- Round label -->
    <div class="round">{{ROUND}}</div>

    <!-- Home team -->
    <div class="team home">
      <img src="{{HOME_LOGO_URL}}" alt="{{HOME_TEAM}}" />
      <span>{{HOME_TEAM}}</span>
    </div>

    <!-- VS separator -->
    <div class="vs">VS</div>

    <!-- Away team -->
    <div class="team away">
      <img src="{{AWAY_LOGO_URL}}" alt="{{AWAY_TEAM}}" />
      <span>{{AWAY_TEAM}}</span>
    </div>

    <!-- Kickoff -->
    <div class="kickoff">{{KICKOFF_DATE}} · {{KICKOFF_TIME}}</div>

    <!-- Broadcast channels -->
    <div class="channels">{{#CHANNELS}}<span class="channel">{{.}}</span>{{/CHANNELS}}</div>

    <!-- OndeAssistir logo -->
    <img class="brand-logo" src="../assets/logo.svg" alt="OndeAssistir" />
  </body>
</html>
```

- [ ] Template created
- [ ] Visual layout agreed on (sketch / reference image added to `generator/assets/`)
- [ ] All data placeholders identified

### 3.3 Template renderer (compose.ts)

Create `generator/src/compose.ts` — fills the template with real match data:

```typescript
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const template = readFileSync(join(__dir, "templates/match-reel.html"), "utf-8");

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_logo_url: string;
  away_logo_url: string;
  kickoff_at: string; // ISO timestamp from Supabase
  round: string;
  channels: string[]; // e.g. ['SporTV', 'Globo']
}

export function composeMatchHtml(match: Match): string {
  const kickoff = new Date(match.kickoff_at);
  const date = kickoff.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const time = kickoff.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  return template
    .replaceAll("{{HOME_TEAM}}", match.home_team)
    .replaceAll("{{AWAY_TEAM}}", match.away_team)
    .replaceAll("{{HOME_LOGO_URL}}", match.home_logo_url)
    .replaceAll("{{AWAY_LOGO_URL}}", match.away_logo_url)
    .replaceAll("{{ROUND}}", match.round)
    .replaceAll("{{KICKOFF_DATE}}", date)
    .replaceAll("{{KICKOFF_TIME}}", time)
    .replace(
      /\{\{#CHANNELS\}\}(.+?)\{\{\/CHANNELS\}\}/s,
      match.channels.map((ch) => `<span class="channel">${ch}</span>`).join("\n"),
    );
}
```

- [ ] `compose.ts` created
- [ ] Test with a hardcoded match object (no Supabase yet), print HTML to stdout, verify it looks right

---

## Phase 4 — Supabase Integration

Connect to real match data.

### 4.1 Environment variables

Create `generator/.env` (never commit this):

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY

# For video storage
SUPABASE_STORAGE_BUCKET=match-videos

# Optional: days ahead to generate (default 1)
DAYS_AHEAD=1
```

Create `generator/.env.example` (commit this):

```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_STORAGE_BUCKET=match-videos
DAYS_AHEAD=1
```

- [ ] `.env` created locally (not committed)
- [ ] `.env.example` committed
- [ ] Supabase service role key obtained from Supabase dashboard → Project Settings → API

### 4.2 Supabase client (supabase.ts)

Create `generator/src/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;

export const db = createClient(url, key);

export async function fetchTodayMatches(): Promise<any[]> {
  const daysAhead = Number(process.env.DAYS_AHEAD ?? 1);
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + daysAhead);
  to.setHours(23, 59, 59, 999);

  const { data, error } = await db
    .from("matches") // ← adjust table name
    .select(
      `
      id,
      home_team,
      away_team,
      home_logo_url,
      away_logo_url,
      kickoff_at,
      round,
      channels
    `,
    )
    .gte("kickoff_at", from.toISOString())
    .lte("kickoff_at", to.toISOString())
    .order("kickoff_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function saveVideoUrl(matchId: string, videoUrl: string) {
  const { error } = await db
    .from("matches")
    .update({ reel_url: videoUrl, reel_generated_at: new Date().toISOString() })
    .eq("id", matchId);
  if (error) throw error;
}
```

- [ ] Confirm actual table name and column names from your Supabase schema
- [ ] Run a test query: `npx tsx generator/src/supabase.ts` (add a temp `main()` block)
- [ ] Matches returned correctly

### 4.3 Confirm Supabase schema has required columns

Your `matches` table needs at minimum:

| Column              | Type        | Notes                             |
| ------------------- | ----------- | --------------------------------- |
| `id`                | uuid / text | Primary key                       |
| `home_team`         | text        |                                   |
| `away_team`         | text        |                                   |
| `home_logo_url`     | text        | Public URL to team logo image     |
| `away_logo_url`     | text        | Public URL to team logo image     |
| `kickoff_at`        | timestamptz | Stored in UTC                     |
| `round`             | text        | e.g. "Rodada 12"                  |
| `channels`          | text[]      | e.g. `{Globo, SporTV}`            |
| `reel_url`          | text        | Populated after render (nullable) |
| `reel_generated_at` | timestamptz | Populated after render (nullable) |

- [ ] All columns confirmed / missing ones added via Supabase migration

---

## Phase 5 — Local Render Pipeline

Wire compose + render + upload together.

### 5.1 Render function (render.ts)

Create `generator/src/render.ts`:

```typescript
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { createRenderJob, executeRenderJob } from "@hyperframes/producer";
import type { Match } from "./compose.js";
import { composeMatchHtml } from "./compose.js";

const __dir = dirname(fileURLToPath(import.meta.url));

export async function renderMatch(match: Match): Promise<string> {
  const html = composeMatchHtml(match);

  // Write HTML to a temp file
  const tmpDir = join(tmpdir(), `hf-${match.id}`);
  mkdirSync(tmpDir, { recursive: true });
  const htmlPath = join(tmpDir, "index.html");
  writeFileSync(htmlPath, html);

  const outputPath = join(tmpDir, "output.mp4");

  const job = createRenderJob({
    input: htmlPath,
    output: outputPath,
    width: 1080,
    height: 1920,
    fps: 30,
    quality: "standard", // draft | standard | high
  });

  await executeRenderJob(job);

  return outputPath; // caller uploads this file
}
```

- [ ] `render.ts` created
- [ ] Render a single match locally with hardcoded data → `.mp4` confirmed

### 5.2 Upload function (upload.ts)

Create `generator/src/upload.ts`:

```typescript
import { readFileSync } from "fs";
import { db } from "./supabase.js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "match-videos";

export async function uploadVideo(matchId: string, filePath: string): Promise<string> {
  const fileBuffer = readFileSync(filePath);
  const storagePath = `reels/${matchId}.mp4`;

  const { error } = await db.storage.from(BUCKET).upload(storagePath, fileBuffer, {
    contentType: "video/mp4",
    upsert: true,
  });

  if (error) throw error;

  const { data } = db.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
```

- [ ] Create the `match-videos` bucket in Supabase Storage (Dashboard → Storage → New bucket → Public)
- [ ] `upload.ts` created
- [ ] Upload test confirmed (upload a dummy file, check bucket)

### 5.3 Main entry point (index.ts)

Create `generator/src/index.ts`:

```typescript
import "dotenv/config";
import { fetchTodayMatches, saveVideoUrl } from "./supabase.js";
import { renderMatch } from "./render.js";
import { uploadVideo } from "./upload.js";
import type { Match } from "./compose.js";

async function run() {
  console.log("[generator] Fetching today's matches...");
  const rows = await fetchTodayMatches();

  if (rows.length === 0) {
    console.log("[generator] No matches today. Done.");
    return;
  }

  console.log(`[generator] Found ${rows.length} match(es). Rendering...`);

  for (const row of rows) {
    const match = row as Match;
    try {
      console.log(`  → ${match.home_team} vs ${match.away_team}`);
      const videoPath = await renderMatch(match);
      const videoUrl = await uploadVideo(match.id, videoPath);
      await saveVideoUrl(match.id, videoUrl);
      console.log(`     ✓ ${videoUrl}`);
    } catch (err) {
      console.error(`     ✗ Failed for match ${match.id}:`, err);
    }
  }

  console.log("[generator] All done.");
}

run().catch((err) => {
  console.error("[generator] Fatal error:", err);
  process.exit(1);
});
```

- [ ] `index.ts` created
- [ ] End-to-end local test: `cd generator && npx tsx src/index.ts`
- [ ] Video appears in Supabase Storage
- [ ] `reel_url` written back to `matches` table

---

## Phase 6 — Render.com Deployment

Move the daily cron job to Render.com.

### 6.1 Dockerfile for the generator

Create `generator/Dockerfile`:

```dockerfile
FROM node:22-bookworm-slim

# System dependencies: FFmpeg + Chromium + fonts
RUN apt-get update && apt-get install -y \
    ffmpeg \
    chromium \
    fonts-noto \
    fonts-liberation \
    fonts-dejavu \
    ca-certificates \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CONTAINER=true

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /app

# Copy monorepo root (needed for workspace linking)
COPY package.json bun.lock ./
COPY packages/core    ./packages/core
COPY packages/engine  ./packages/engine
COPY packages/producer ./packages/producer
COPY generator        ./generator

RUN bun install --frozen-lockfile

WORKDIR /app/generator

CMD ["bun", "run", "src/index.ts"]
```

- [ ] `generator/Dockerfile` created
- [ ] Build locally: `docker build -f generator/Dockerfile -t oa-generator .`
- [ ] Run locally with env vars:
  ```bash
  docker run --env-file generator/.env oa-generator
  ```
- [ ] Same output as non-Docker run

### 6.2 Render.com service setup

In your Render.com dashboard:

1. **New → Cron Job**
2. **Source:** Connect GitHub repo `ondeassistir/hyperframes`
3. **Branch:** `main` (or your production branch)
4. **Dockerfile path:** `generator/Dockerfile`
5. **Schedule:** `0 6 * * *` (runs daily at 06:00 UTC = 03:00 BRT)
   - Adjust to run before your earliest kickoff
   - For same-day reels: `0 5 * * *` (5am UTC)
   - For next-day previews: can run at any time
6. **Instance type:** Standard (2GB RAM minimum for Chromium + FFmpeg)

- [ ] Service created on Render.com
- [ ] Environment variables added (Dashboard → Environment):
  ```
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  SUPABASE_STORAGE_BUCKET
  DAYS_AHEAD
  NODE_ENV=production
  ```
- [ ] Manual trigger ("Run Now") succeeds in Render logs
- [ ] Scheduled run confirmed next morning

### 6.3 Verify production run

- [ ] Video files appear in Supabase Storage bucket after cron fires
- [ ] `matches.reel_url` is populated for each rendered match
- [ ] No failed renders in Render.com logs

---

## Phase 7 — Dashboard Integration (Future)

Once the cron is stable, expose renders to your dashboard.

### 7.1 Supabase query for dashboard

```sql
-- Today's matches with their reels
SELECT
  id, home_team, away_team, kickoff_at, round,
  channels, reel_url, reel_generated_at
FROM matches
WHERE kickoff_at::date = CURRENT_DATE
ORDER BY kickoff_at;
```

### 7.2 On-demand render endpoint (optional)

If you want to trigger a re-render from the dashboard without waiting for the cron,
add an HTTP endpoint to the generator using Bun's built-in HTTP server or a
lightweight framework like Hono. This would be a separate Render.com **Web Service**
alongside the cron job.

- [ ] Decide if on-demand endpoint is needed (can skip for v1)

---

## Key Decisions & Open Items

| Item                                              | Decision                                                    | Status |
| ------------------------------------------------- | ----------------------------------------------------------- | ------ |
| Catalog blocks to use                             | Custom template (`match-reel.html`) built with brand tokens | [x]    |
| Video duration                                    | 12s per reel                                                | [x]    |
| Reel content: one match per video or multi-match? | One match per video                                         | [x]    |
| Cron schedule (UTC time)                          | `0 6 * * *` (adjust)                                        | [ ]    |
| Render.com instance size                          | Standard (2GB)                                              | [ ]    |
| Supabase Storage bucket visibility                | Public (for direct URL use)                                 | [ ]    |
| Custom fonts: Google or local files?              | Google Fonts (Sora) via @import                             | [x]    |

---

## Progress Tracker

| Phase | Description                | Status                                               |
| ----- | -------------------------- | ---------------------------------------------------- |
| 1     | Local Foundation           | [x] Done                                             |
| 2     | Brand System               | [x] Done                                             |
| 3     | Match Composition Template | [x] Done — `generator/src/templates/match-reel.html` |
| 4     | Supabase Integration       | [ ] Next                                             |
| 5     | Local Render Pipeline      | [ ]                                                  |
| 6     | Render.com Deployment      | [ ]                                                  |
| 7     | Dashboard Integration      | [ ]                                                  |

### What was built in Phase 2 & 3

```
generator/
  .env.example                      ← env var template
  .gitignore
  package.json                      ← @ondeassistir/generator workspace pkg
  tsconfig.json
  src/
    brand.css                       ← all OndeAssistir CSS tokens + animations
    compose.ts                      ← fills match-reel.html with real data
    templates/
      match-reel.html               ← 1080×1920 Instagram Reel composition
```

**Template features:**

- 12s / 30fps / 1080×1920 (Instagram Reels format)
- Sora font (Google Fonts)
- Dark navy background with purple top glow
- Animated purple-to-blue conic border around match card
- Home / Away team logos in circular rings with entrance animations
- Kickoff date + time (formatted in `America/Sao_Paulo`)
- Broadcast channel badges
- OndeAssistir footer branding

---

_Last updated: 2026-04-17_
