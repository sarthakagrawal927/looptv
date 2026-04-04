<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LoopTV - Agent Reference

## Project Context

TV-like app that plays random YouTube videos from configured channels. Currently SNL-only but designed for multi-channel expansion.

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS v4
- TypeScript
- YouTube IFrame Player API (client-side)
- yt-dlp for catalog building (no YouTube API key needed)

## Key Patterns

- All player/UI logic is client-side (`"use client"` components)
- Catalog is a static JSON file loaded at runtime via fetch
- Channel config is in `channels.config.ts` at project root
- Categories are matched by title regex patterns defined in channel config
- Player handles embed errors (code 101/150) by auto-skipping to next video

## File Structure

```
channels.config.ts          — Channel + category definitions
public/catalog.json         — Generated video catalog
scripts/build-catalog.sh    — Catalog builder (yt-dlp)
src/
  app/
    page.tsx                — Entry point (renders TVApp)
    layout.tsx              — Root layout (dark theme)
    globals.css             — Base styles
  components/
    TVApp.tsx               — Main orchestrator
    Player.tsx              — YouTube IFrame wrapper
    ChannelBar.tsx          — Category switcher UI
    TVOverlay.tsx           — Now-playing info overlay
  lib/
    types.ts                — TypeScript interfaces
    catalog.ts              — Catalog utils (load, filter, random pick, search)
```

## Testing

Not yet configured. When adding tests: Vitest for unit, Playwright for e2e.
