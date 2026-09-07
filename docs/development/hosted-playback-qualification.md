---
title: Hosted playback qualification
description: Representative deployed playback acceptance on 2026-09-07.
---

# Hosted playback qualification — 2026-09-07

Source `9325870796b41d777be63ad73ece4c6279572398` was released through
[Actions 34125220328](https://github.com/Significant-Hobbies/looptv/actions/runs/34125220328).
The immutable release is [779ffe6c.looptv.pages.dev](https://779ffe6c.looptv.pages.dev).
Acceptance exercised [the public domain](https://tv.significanthobbies.com/science/)
in fresh Chrome contexts at 1280×844 and 390×844, with no account or existing
watch history. No further deployment or catalog refresh was performed.

## Actual hosted journey

- Initial Play, immediate Next during iframe startup, and another Next after
  readiness selected videos whose rail title matched YouTube `getVideoData()`.
  The receipt retains only video ID, title and playback time, not raw provider data.
- After ready-state Next, actual playback advanced by more than two seconds
  at each width. Pause and resume reached player states 2 and 1 respectively.
- Search for `immune` returned matching results; Escape closed the overlay.
  Used playback/search controls remained reachable, with no horizontal overflow.
- Station pages contain no portfolio-strip script. Browsing pages retain the
  script and a visible footer `portfolio-project-strip`: height 44 pixels,
  68 shadow-root links at both widths. It is below the page content, not a
  station overlay.

See the [compact receipt](2026-09-07-hosted-playback-receipt.json),
[desktop](2026-09-07-hosted-playback-1280.png) and
[mobile](2026-09-07-hosted-playback-390.png) screenshots.

## Controlled unavailable-video handling

Separate fresh contexts loaded the hosted application with a synthetic YouTube
API response. Injecting error 101 and then 150 caused automatic skips to new
catalog videos with matching rail titles at both widths. This exercises the
deployed handler and state transition; it does **not** establish actual upstream
restriction behavior or successful playback of the synthetic replacement player.

## Decision and limits

[Issue #51](https://github.com/Significant-Hobbies/looptv/issues/51) is complete.
The representative public station/viewing/search experience is suitable for
scoped sharing. Keep the product inactive and done; this is not a new roadmap.
No claim covers every upstream video, long-running sessions, physical mobile/TV
devices, catalog refresh/tagging, or changes in YouTube embedding availability.
The prior 233-test quality gate and delayed-startup regression remain source
evidence; these hosted checks supply the release acceptance separately.
