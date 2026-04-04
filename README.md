# LoopTV

TV-like app that plays random YouTube videos from curated channels, nonstop. Pick a channel, hit play, and lean back.

**Zero API keys needed.** Uses yt-dlp for catalog building and YouTube's free IFrame Player for playback. HuggingFace NER auto-tags videos with people, places, and topics — no hardcoded lists.

## Channels

Each LoopTV channel can combine multiple YouTube channels into one stream. Categories are auto-derived from video metadata using NER.

| Channel | Sources | Videos |
|---------|---------|--------|
| Saturday Night Live | @SaturdayNightLive | ~8,900 |
| Science | @kurzgesagt + @TEDEd | ~2,500 |

## Add a Channel

Edit `stations.json`:

```json
{
  "id": "comedy",
  "name": "Comedy",
  "description": "Stand-up and sketches",
  "sources": [
    { "name": "Comedy Central", "handle": "@ComedyCentral", "minDuration": 60, "maxDuration": 1800 }
  ]
}
```

Then rebuild:

```bash
bash scripts/build-catalog.sh
```

NER tagging runs automatically in GitHub Actions weekly, or manually:

```bash
pip install -r requirements-ner.txt
python3 scripts/extract-tags.py
```

## Setup

```bash
pnpm install
pnpm dev
```

## Build Catalog

Requires [yt-dlp](https://github.com/yt-dlp/yt-dlp):

```bash
brew install yt-dlp    # or pip install yt-dlp
bash scripts/build-catalog.sh
```

## How It Works

```
stations.json          ← Add YouTube channels here
     ↓
build-catalog.sh       ← yt-dlp fetches video metadata (titles, descriptions, durations)
     ↓
process-catalog.mjs    ← Merges with existing catalog, preserves NER tags for known videos
     ↓
extract-tags.py        ← HuggingFace NER (dslim/bert-base-NER) extracts people, places
     ↓                    Auto-derives categories from most frequent tags
catalog.json           ← Committed to repo, served as static JSON
     ↓
Next.js frontend       ← Picks random videos, plays via YouTube IFrame API
```

## Controls

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| N / Right | Next random video |
| P / Left | Previous video |
| M | Mute / Unmute |
| / | Search |
| F | Fullscreen |
| Esc | Close search |

## GitHub Actions

The catalog updates weekly via GitHub Actions (`.github/workflows/update-catalog.yml`). It fetches new videos, runs NER only on new additions, and commits the updated catalog.

## Stack

- Next.js 16 + Tailwind CSS v4
- YouTube IFrame Player API (free, no key)
- yt-dlp (free, no key)
- HuggingFace Transformers (dslim/bert-base-NER)

## License

MIT
