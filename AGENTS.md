<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes -- APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LoopTV - Agent Reference

## Project Context

TV-like app that plays random YouTube videos from curated stations. 13 stations, 78 YouTube channels, ~38K videos. NER-based auto-tagging via HuggingFace.

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS v4
- TypeScript
- YouTube IFrame Player API (client-side)
- yt-dlp for catalog building (no YouTube API key needed)
- HuggingFace Transformers for NER tagging

## Key Patterns

- All player/UI logic is client-side (`"use client"` components)
- Catalog is a static JSON file loaded at runtime via fetch
- `stations.json` is the single config file (channels.config.ts just re-exports it)
- Quality filters: per-source minDuration/maxDuration, global 10K views minimum
- Player handles embed errors (code 101/150) by auto-skipping to next video
- Watched videos tracked in localStorage via `watched.ts`

## File Structure

```
stations.json               -- Station + source definitions
channels.config.ts          -- Re-exports stations.json as typed config
public/catalog.json         -- Generated video catalog
data/sources/               -- Local cache for raw JSONL from yt-dlp
scripts/
  build-catalog.sh          -- Full pipeline: fetch + process + tag
  fetch-all-sources.sh      -- yt-dlp fetch for all sources
  process-catalog.mjs       -- Merge raw JSONL into catalog
  extract-tags.py           -- HuggingFace NER tagging
src/
  app/
    page.tsx                -- Entry point (renders TVApp)
    layout.tsx              -- Root layout (dark theme)
    globals.css             -- Base styles
    [channel]/              -- Dynamic route for station pages
  components/
    TVApp.tsx               -- Main orchestrator
    Player.tsx              -- YouTube IFrame wrapper
    Search.tsx              -- Search overlay
  lib/
    types.ts                -- TypeScript interfaces
    catalog.ts              -- Catalog utils (load, filter, random pick, search)
    watched.ts              -- localStorage watched tracking + stats
```

## Testing

Not yet configured. When adding tests: Vitest for unit, Playwright for e2e.
