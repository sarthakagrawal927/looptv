#!/usr/bin/env bash
set -euo pipefail

# Build video catalog for all LoopTV stations
# Reads station config from stations.json
# Uses cached data from data/sources/ if available, otherwise fetches fresh
#
# Usage:
#   ./scripts/build-catalog.sh              # Use cached + fetch missing
#   ./scripts/build-catalog.sh --fresh      # Re-fetch everything

OUTPUT="public/catalog.json"
DATA_DIR="data/sources"
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT
FRESH="${1:-}"

mkdir -p "$DATA_DIR"

# Extract unique YouTube handles from stations.json
HANDLES=$(node -e "
  const stations = require('./stations.json');
  const handles = new Set();
  for (const s of stations) for (const src of s.sources) handles.add(src.handle);
  console.log([...handles].join(' '));
")

echo "Stations need handles: $(echo $HANDLES | wc -w | tr -d ' ') channels"
echo ""

for handle in $HANDLES; do
  SAFE=$(echo "$handle" | tr -d '@')
  CACHED="$DATA_DIR/${SAFE}.jsonl"

  if [ "$FRESH" != "--fresh" ] && [ -f "$CACHED" ] && [ -s "$CACHED" ]; then
    COUNT=$(wc -l < "$CACHED" | tr -d ' ')
    printf "  @%-30s CACHED (%s videos)\n" "$SAFE" "$COUNT"
    cp "$CACHED" "$TEMP_DIR/${SAFE}.jsonl"
  else
    printf "  @%-30s fetching..." "$SAFE"
    yt-dlp --flat-playlist --dump-json --no-warnings \
      "https://www.youtube.com/$handle/videos" > "$TEMP_DIR/${SAFE}.jsonl" 2>/dev/null || true
    COUNT=$(wc -l < "$TEMP_DIR/${SAFE}.jsonl" | tr -d ' ')
    printf " %s videos\n" "$COUNT"
    # Save to cache
    cp "$TEMP_DIR/${SAFE}.jsonl" "$CACHED"
  fi
done

echo ""
node scripts/process-catalog.mjs "$TEMP_DIR" "$OUTPUT"
echo "Done!"
