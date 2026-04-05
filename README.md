# LoopTV

TV-like app that plays random YouTube videos from curated channels, nonstop. Pick a station, hit play, and lean back.

**Zero API keys needed.** Uses yt-dlp for catalog building and YouTube's free IFrame Player for playback. HuggingFace NER auto-tags videos with people, places, and topics.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsarthakagrawal927%2Flooptv)

> **Fork it, edit `stations.json` with your own YouTube channels, and deploy.** That's it.

## Stats

- 13 stations, 78 YouTube channels, ~38K videos
- NER-based auto-tagging via HuggingFace (dslim/bert-base-NER)
- Quality filters: per-source minDuration/maxDuration, global 10K views minimum
- Watched tracking with localStorage

## Configuration

`stations.json` is the single config file. Each station groups one or more YouTube channels:

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

NER tagging runs automatically in GitHub Actions weekly, or manually:

```bash
pip install -r requirements-ner.txt
python3 scripts/extract-tags.py
```

## How It Works

```
stations.json          <- Add YouTube channels here
     |
build-catalog.sh       <- yt-dlp fetches video metadata (titles, descriptions, durations)
     |
process-catalog.mjs    <- Merges with existing catalog, preserves NER tags for known videos
     |
extract-tags.py        <- HuggingFace NER (dslim/bert-base-NER) extracts people, places
     |                    Auto-derives categories from most frequent tags
catalog.json           <- Committed to repo, served as static JSON
     |
Next.js frontend       <- Picks random videos, plays via YouTube IFrame API
```

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/build-catalog.sh` | Full pipeline: fetch sources, process, extract tags |
| `scripts/process-catalog.mjs` | Merge raw JSONL into catalog.json, preserve existing tags |
| `scripts/extract-tags.py` | HuggingFace NER tagging on new/untagged videos |
| `scripts/fetch-all-sources.sh` | Fetch raw JSONL for all sources via yt-dlp |

## Controls

| Key | Action |
|-----|--------|
| Space | Play / Pause |
| N / Right | Next random video |
| P / Left | Previous video |
| M | Mute / Unmute |
| F | Fullscreen |
| W | Hide watched videos |
| / | Search |
| 1-9 | Jump to station by number |
| Esc | Close search |

## GitHub Actions

The catalog updates weekly via GitHub Actions (`.github/workflows/update-catalog.yml`). It fetches new videos, runs NER only on new additions, and commits the updated catalog.

## Deployment

Deployed on Vercel.

## Stack

- Next.js 16 + Tailwind CSS v4
- YouTube IFrame Player API (free, no key)
- yt-dlp (free, no key)
- HuggingFace Transformers (dslim/bert-base-NER)

## License

MIT
