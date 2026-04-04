@AGENTS.md

# LoopTV

TV-like random video player for YouTube channels. Currently configured for Saturday Night Live.

## Architecture

- **Next.js App Router** + Tailwind
- **YouTube IFrame Player API** for playback (free, no key needed)
- **yt-dlp** for catalog building (no API key needed)
- Static `public/catalog.json` loaded at runtime
- Multi-channel data model: `channels.config.ts` defines channels + categories

## Key Files

- `channels.config.ts` — Channel definitions (YouTube IDs, categories, title-matching rules)
- `scripts/build-catalog.sh` — yt-dlp-based catalog builder
- `src/components/TVApp.tsx` — Main app orchestrator (client component)
- `src/components/Player.tsx` — YouTube IFrame wrapper
- `src/lib/types.ts` — Shared types
- `src/lib/catalog.ts` — Catalog loading + random selection

## Commands

```bash
pnpm dev              # Dev server
pnpm build            # Production build
pnpm run build:catalog # Rebuild video catalog (requires yt-dlp)
```

## Adding a New Channel

1. Add a `ChannelConfig` entry to `channels.config.ts`
2. Run `pnpm run build:catalog` (update script to accept the new channel URL)
3. The frontend automatically picks up new channels from the catalog

## Data Flow

```
yt-dlp → catalog.json → TVApp loads JSON → picks random video → YouTube IFrame plays it
                                          → on end/error → picks next random video
```
