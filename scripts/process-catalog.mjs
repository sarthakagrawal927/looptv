// Process raw yt-dlp JSONL files into a LoopTV catalog
// Merges with existing catalog — preserves NER tags for known videos
// Usage: node scripts/process-catalog.mjs <temp_dir> <output_path>

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = process.argv[2];
const OUTPUT = process.argv[3];

const stationsConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "stations.json"), "utf-8")
);

// Load existing catalog to preserve NER-enriched tags
let existing = { stations: {} };
if (fs.existsSync(OUTPUT)) {
  try {
    existing = JSON.parse(fs.readFileSync(OUTPUT, "utf-8"));
  } catch {}
}

// Build lookup of existing videos by ID (preserves their tags)
const existingVideos = new Map();
for (const station of Object.values(existing.stations || {})) {
  for (const v of station.videos || []) {
    existingVideos.set(v.id, v);
  }
}

const catalog = { lastUpdated: "", stations: {} };
let totalNew = 0;

for (const station of stationsConfig) {
  const allVideos = [];

  for (const src of station.sources) {
    const handle = src.handle.replace("@", "");
    const filePath = path.join(TEMP_DIR, `${handle}.jsonl`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  Warning: no data for ${src.handle}, skipping`);
      continue;
    }

    const minDur = src.minDuration ?? 60;
    const maxDur = src.maxDuration ?? 3600;
    const lines = fs.readFileSync(filePath, "utf-8").trim().split("\n");

    for (const line of lines) {
      try {
        const raw = JSON.parse(line);
        const dur = raw.duration || 0;
        if (dur < minDur || dur > maxDur) continue;

        // Quality filters: minimum 2 min, minimum 10K views
        if (dur < 120) continue;
        if ((raw.view_count || 0) < 10000) continue;

        const prev = existingVideos.get(raw.id);
        if (prev && prev.tags && prev.tags.length > 1) {
          // Existing video with NER tags — keep them, update viewCount
          prev.viewCount = raw.view_count || prev.viewCount || 0;
          allVideos.push(prev);
        } else {
          // New video — needs NER processing
          totalNew++;
          allVideos.push({
            id: raw.id,
            title: raw.title || "",
            duration: dur,
            date: "",
            tags: [src.name],
            source: src.name,
            viewCount: raw.view_count || 0,
            description: (raw.description || "").slice(0, 300),
          });
        }
      } catch {}
    }
  }

  catalog.stations[station.id] = { videos: allVideos, categoryVideoIds: {} };

  const sourceNames = station.sources.map((s) => s.name).join(" + ");
  const newInStation = allVideos.filter((v) => v.description).length;
  console.log(
    `${station.id}: ${allVideos.length} videos (${sourceNames}), ${newInStation} new`
  );
}

catalog.lastUpdated = new Date().toISOString();
fs.writeFileSync(OUTPUT, JSON.stringify(catalog));
const sizeKB = Math.round(fs.statSync(OUTPUT).size / 1024);
console.log(`\nTotal new videos needing NER: ${totalNew}`);
console.log(`Output: ${OUTPUT} (${sizeKB}KB)`);
