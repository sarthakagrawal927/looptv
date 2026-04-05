@AGENTS.md

# LoopTV

TV-like random video player for YouTube channels. 13 stations, 78 YouTube channels, ~38K videos.

## Architecture

- **Next.js App Router** + Tailwind
- **YouTube IFrame Player API** for playback (free, no key needed)
- **yt-dlp** for catalog building (no API key needed)
- **HuggingFace NER** (dslim/bert-base-NER) for auto-tagging
- Static `public/catalog.json` loaded at runtime
- `stations.json` is the single config file (channels.config.ts just re-exports it)

## Key Files

- `stations.json` — Station definitions: YouTube handles, duration filters, grouping
- `scripts/build-catalog.sh` — Full pipeline: fetch + process + tag
- `scripts/fetch-all-sources.sh` — yt-dlp fetch for all sources
- `scripts/process-catalog.mjs` — Merge raw JSONL into catalog, preserve existing tags
- `scripts/extract-tags.py` — HuggingFace NER tagging
- `src/components/TVApp.tsx` — Main app orchestrator (client component)
- `src/components/Player.tsx` — YouTube IFrame wrapper
- `src/components/Search.tsx` — Search overlay
- `src/lib/types.ts` — Shared types
- `src/lib/catalog.ts` — Catalog loading + random selection
- `src/lib/watched.ts` — localStorage watched tracking + stats
- `data/sources/` — Local cache for raw JSONL from yt-dlp

## Scripts Pipeline

```
stations.json → build-catalog.sh → process-catalog.mjs → extract-tags.py → catalog.json
```

## Commands

```bash
pnpm dev              # Dev server
pnpm build            # Production build
pnpm run build:catalog # Full catalog rebuild (requires yt-dlp)
pnpm run build:ner    # Run NER tagging only
pnpm run fetch:all    # Fetch all sources via yt-dlp
```

## Adding a New Station

1. Add a station entry to `stations.json`
2. Run `pnpm run build:catalog` (requires yt-dlp)
3. The frontend automatically picks up new stations from the catalog

## Data Flow

```
yt-dlp → data/sources/*.jsonl → process-catalog.mjs → catalog.json
→ TVApp loads JSON → picks random video → YouTube IFrame plays it
→ on end/error → picks next random video
→ watched.ts tracks viewed videos in localStorage
```
