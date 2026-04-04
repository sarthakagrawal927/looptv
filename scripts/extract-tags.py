#!/usr/bin/env python3
"""
Enrich video tags using HuggingFace NER (dslim/bert-base-NER).
Zero hardcoded entity lists — the model discovers people, orgs, locations, etc.

Pipeline:
  1. build-catalog.sh → process-catalog.mjs (raw catalog with descriptions)
  2. extract-tags.py (this script) → enriched tags + auto-derived categories

Usage: python3 scripts/extract-tags.py [catalog_path]
"""

import json
import sys
import os
import re
from collections import Counter

def main():
    catalog_path = sys.argv[1] if len(sys.argv) > 1 else "public/catalog.json"

    model_name = os.environ.get("NER_MODEL", "dslim/bert-base-NER")
    print(f"Loading NER model ({model_name})...")
    from transformers import pipeline
    ner = pipeline(
        "ner",
        model=model_name,
        aggregation_strategy="max",  # better subword merging than "simple"
        device=-1,  # CPU
    )

    # Load station config for source name filtering
    sources_by_station = {}
    try:
        with open("stations.json") as f:
            for s in json.load(f):
                sources_by_station[s["id"]] = {src["name"] for src in s["sources"]}
    except (FileNotFoundError, json.JSONDecodeError, KeyError) as e:
        print(f"  Warning: could not load stations.json: {e}")

    with open(catalog_path) as f:
        catalog = json.load(f)

    for station_id, station in catalog["stations"].items():
        videos = station["videos"]
        source_names = sources_by_station.get(station_id, set())

        # Only process videos that need NER (have description = new, or tags <= 1)
        needs_ner = [v for v in videos if v.get("description") or len(v.get("tags", [])) <= 1]
        already_done = len(videos) - len(needs_ner)
        print(f"\n=== {station_id}: {len(videos)} total, {len(needs_ner)} need NER, {already_done} cached ===", flush=True)

        if not needs_ner:
            print("  Nothing to process, skipping.", flush=True)
        else:
            batch_size = 64
            for i in range(0, len(needs_ner), batch_size):
                batch = needs_ner[i : i + batch_size]

                texts = [
                    f"{v['title']}. {v.get('description', '')}".strip()[:512]
                    for v in batch
                ]

                results = ner(texts)

                for v, entities in zip(batch, results):
                    tags = set()
                    if v.get("source"):
                        tags.add(v["source"])

                    for ent in entities:
                        word = ent["word"].strip()
                        word = word.replace(" ##", "").replace("##", "")
                        word = word.strip(".,!?:;'\"()[]#- ")
                        label = ent["entity_group"]  # PER, ORG, LOC, MISC
                        score = ent["score"]

                        if score < 0.8 or len(word) < 3:
                            continue

                        # Keep PER (people) and LOC (places) — these make good categories
                        # Drop ORG (brands, channels) and MISC (adjectives, nationalities)
                        # which produce noise like "Peacock", "Patreon", "German", "SNL"
                        if label not in ("PER", "LOC"):
                            continue

                        tags.add(word)

                    v["tags"] = list(tags)[:20]

                done = min(i + batch_size, len(needs_ner))
                if done % 500 < batch_size or done == len(needs_ner):
                    print(f"  {done}/{len(needs_ner)}", flush=True)

        # Auto-derive categories from tag frequency
        tag_counts = Counter()
        for v in videos:
            for t in v["tags"]:
                if t in source_names:
                    continue
                tag_counts[t] += 1

        # Dynamic threshold: top tags with reasonable frequency
        min_count = max(10, len(videos) // 200)
        top_tags = [
            (tag, count) for tag, count in tag_counts.most_common(15)
            if count >= min_count
        ]

        category_video_ids = {}
        for tag, count in top_tags:
            slug = slugify(tag)
            category_video_ids[slug] = [
                v["id"] for v in videos if tag in v["tags"]
            ]
            print(f"  {tag}: {count}")

        station["categoryVideoIds"] = category_video_ids

    # Strip descriptions to save space (they were only needed for NER)
    for station in catalog["stations"].values():
        for v in station["videos"]:
            v.pop("description", None)

    catalog["lastUpdated"] = __import__("datetime").datetime.now().isoformat()

    with open(catalog_path, "w") as f:
        json.dump(catalog, f)

    size_kb = os.path.getsize(catalog_path) // 1024
    print(f"\nOutput: {catalog_path} ({size_kb}KB)")


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")


if __name__ == "__main__":
    main()
