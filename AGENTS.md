<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes -- APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# agents.md — LoopTV

## Purpose
TV-like random YouTube player with 13 stations, 78 channels, and ~38K videos — zero API keys needed for playback or catalog building.

## Stack
- Framework: Next.js 16 (App Router, Turbopack)
- Language: TypeScript (frontend), Python (NER tagging), Bash (catalog pipeline)
- Styling: Tailwind CSS v4
- DB: None — static `public/catalog.json` served at runtime; watched history in localStorage
- Auth: None
- Testing: Vitest (unit)
- Deploy: Cloudflare Workers (via OpenNext) — `looptv.sarthakagrawal927.workers.dev`
- Package manager: pnpm

## Repo structure
```
stations.json               # Station definitions + YouTube channel handles (primary config)
channels.config.ts          # Re-exports stations.json as typed TS
public/catalog.json         # Generated video catalog (~38K entries) — committed to repo
data/sources/               # Raw JSONL from yt-dlp (gitignored)
scripts/
  build-catalog.sh          # Full pipeline: fetch + process + NER tag
  fetch-all-sources.sh      # yt-dlp fetch → data/sources/*.jsonl
  process-catalog.mjs       # Merge JSONL into catalog.json, preserve existing NER tags
  tag-videos.mjs            # Additional tagging step
  extract-tags.py           # HuggingFace NER (dslim/bert-base-NER) tagging
  __tests__/catalog.test.ts # Vitest tests for catalog processing
requirements-ner.txt        # Python deps (transformers, torch)
src/
  app/
    page.tsx          # Entry (renders TVApp)
    layout.tsx        # Root layout (dark theme)
    [channel]/        # Dynamic per-station pages
  components/
    TVApp.tsx         # Main client-side orchestrator (station selection, playback state)
    Player.tsx        # YouTube IFrame API wrapper — auto-skips on errors 101/150
    Search.tsx        # Search overlay
  lib/
    types.ts          # Station, Video, Catalog interfaces
    catalog.ts        # Catalog loading, filtering, random selection, search
    watched.ts        # localStorage watched tracking + stats
    __tests__/        # Vitest unit tests
.github/workflows/
  update-catalog.yml  # Weekly cron: fetch new videos + NER tag + commit catalog
```

## Key commands
```bash
pnpm dev              # Next.js dev server
pnpm build            # Production build
pnpm test             # vitest run
pnpm lint             # eslint

# Catalog pipeline (requires yt-dlp: brew install yt-dlp)
pnpm run build:catalog    # Full rebuild: fetch + process + NER tag
pnpm run fetch:all        # Fetch raw JSONL for all sources
pnpm run build:ner        # Run NER tagging only

# Python NER setup
pip install -r requirements-ner.txt
python3 scripts/extract-tags.py
```

## Architecture notes
- **100% client-side playback.** `TVApp.tsx` and `Player.tsx` are `"use client"`. Server renders only the shell; `catalog.json` fetched client-side via `fetch('/catalog.json')`.
- **Static catalog committed to repo.** Weekly GH Actions cron rebuilds it — only new/untagged videos go through NER to keep CI fast.
- **Catalog pipeline**: `stations.json` → yt-dlp → JSONL → `process-catalog.mjs` (merge + dedup, preserves NER tags) → `extract-tags.py` (NER on untagged only) → `public/catalog.json`.
- **Embed error handling**: YouTube errors 101/150 (embedding blocked) caught by `Player.tsx` → auto-skip.
- **Quality filters**: per-source `minDuration`/`maxDuration` in `stations.json`; global 10K views minimum in `process-catalog.mjs`.
- **Adding a station**: add entry to `stations.json`, run `pnpm run build:catalog`, commit updated `catalog.json`.
- **Turbopack** used — has breaking changes vs webpack; check Next.js docs for Turbopack-specific behavior.
- No env vars required.

## Active context
