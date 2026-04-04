"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Catalog, Video } from "@/lib/types";
import { loadCatalog, getVideosForStation, pickRandom, formatDuration } from "@/lib/catalog";
import Link from "next/link";
import Player, { type PlayerHandle } from "./Player";
import Search from "./Search";
import stations from "../../channels.config";

export default function TVApp({ initialChannel }: { initialChannel?: string }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [activeStation, setActiveStation] = useState(initialChannel || stations[0].id);
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [status, setStatus] = useState<string>("Loading...");
  const [mode, setMode] = useState<"landing" | "lobby" | "playing">(initialChannel ? "lobby" : "landing");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const skippedRef = useRef(new Set<string>());
  const historyRef = useRef<Video[]>([]);
  const playerRef = useRef<PlayerHandle>(null);

  const config = stations.find((s) => s.id === activeStation) ?? stations[0];

  const categories = useMemo(() => {
    const sc = catalog?.stations?.[activeStation];
    if (!sc) return [{ id: "all", name: "All" }];
    return [
      { id: "all", name: "All" },
      ...Object.entries(sc.categoryVideoIds)
        .map(([id, ids]) => ({
          id,
          name: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          count: ids.length,
        }))
        .sort((a, b) => b.count - a.count),
    ];
  }, [catalog, activeStation]);

  useEffect(() => {
    loadCatalog()
      .then((c) => { setCatalog(c); setStatus(""); })
      .catch(() => setStatus("No catalog found. Run: pnpm run build:catalog"));
  }, []);

  const playNext = useCallback(
    (cat?: string) => {
      if (!catalog) return;
      const videos = getVideosForStation(catalog, activeStation, cat || activeCategory);
      const available = videos.filter((v) => !skippedRef.current.has(v.id));
      if (available.length < 5) skippedRef.current.clear();

      const next = pickRandom(available.length > 0 ? available : videos, currentVideo?.id);
      if (next) {
        if (currentVideo) historyRef.current.push(currentVideo);
        setCurrentVideo(next);
        setStatus("");
        setPaused(false);
      } else {
        setStatus("No videos in this category");
      }
    },
    [catalog, activeStation, activeCategory, currentVideo]
  );

  const playPrev = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) { setCurrentVideo(prev); setStatus(""); setPaused(false); }
  }, []);

  const playVideo = useCallback(
    (video: Video) => {
      if (currentVideo) historyRef.current.push(currentVideo);
      setCurrentVideo(video);
      setStatus("");
      setPaused(false);
      setSearchOpen(false);
      setMode("playing");
    },
    [currentVideo]
  );

  const handleCategoryChange = useCallback(
    (id: string) => {
      setActiveCategory(id);
      skippedRef.current.clear();
      if (catalog) {
        const videos = getVideosForStation(catalog, activeStation, id);
        const next = pickRandom(videos);
        if (next) {
          if (currentVideo) historyRef.current.push(currentVideo);
          setCurrentVideo(next);
          setStatus("");
          setPaused(false);
        }
      }
    },
    [catalog, activeStation, currentVideo]
  );

  const startPlaying = useCallback(() => {
    setMode("playing");
    playNext();
  }, [playNext]);

  useEffect(() => {
    if (mode === "playing" && catalog && !currentVideo) playNext();
  }, [mode, catalog, currentVideo, playNext]);

  // Keyboard shortcuts — mode-aware
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Global shortcuts
      if (e.key === "/") { e.preventDefault(); setSearchOpen(true); return; }
      if (e.key === "Escape") { e.preventDefault(); setSearchOpen(false); return; }
      if (searchOpen) return;

      // Lobby: Space and N start playing
      if (mode === "lobby") {
        if (e.key === " " || e.key.toLowerCase() === "n") {
          e.preventDefault();
          startPlaying();
        }
        return;
      }

      // Playing mode shortcuts
      if (mode !== "playing") return;
      switch (e.key.toLowerCase()) {
        case " ": e.preventDefault(); playerRef.current?.togglePlay(); setPaused((p) => !p); break;
        case "n": case "arrowright": e.preventDefault(); playNext(); break;
        case "p": case "arrowleft": e.preventDefault(); playPrev(); break;
        case "m": e.preventDefault(); playerRef.current?.toggleMute(); setMuted((m) => !m); break;
        case "f": e.preventDefault(); document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); break;
        default: {
          const n = parseInt(e.key);
          if (n >= 1 && n <= Math.min(categories.length, 9)) {
            e.preventDefault();
            handleCategoryChange(categories[n - 1].id);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode, playNext, playPrev, handleCategoryChange, categories, searchOpen, startPlaying]);

  const handleError = useCallback(
    (code: number) => {
      if (currentVideo) skippedRef.current.add(currentVideo.id);
      setStatus("Skipping...");
      setTimeout(() => playNext(), 500);
    },
    [currentVideo, playNext]
  );

  const allVideos = catalog?.stations?.[activeStation]?.videos ?? [];
  const catalogLoaded = catalog !== null;

  // ── Landing: channel picker ──
  if (mode === "landing") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
        <div className="text-center mb-10">
          <h1 className="text-white text-5xl font-bold tracking-tight mb-2">LoopTV</h1>
          <p className="text-white/40 text-base">Pick a channel. Random clips play nonstop.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {stations.map((st) => {
            const count = catalog?.stations?.[st.id]?.videos?.length ?? 0;
            return (
              <Link
                key={st.id}
                href={`/${st.id}`}
                className="text-left p-5 rounded-xl border transition-all border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] block no-underline"
              >
                <h2 className="text-white text-lg font-semibold">{st.name}</h2>
                <p className="text-white/40 text-sm mt-1">{st.description}</p>
                <p className="text-white/30 text-xs mt-2">
                  {count ? `${count.toLocaleString()} videos` : catalogLoaded ? "No videos" : "Loading..."}
                  {st.sources.length > 1 && ` \u00b7 ${st.sources.map((s) => s.name).join(" + ")}`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Lobby: channel selected, show play + search ──
  if (mode === "lobby") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
        <Link href="/" className="absolute top-6 left-6 text-white/30 hover:text-white/60 transition-colors text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          All channels
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-white text-4xl font-bold tracking-tight mb-1">{config.name}</h1>
          <p className="text-white/40 text-sm">
            {config.sources.length > 1 && config.sources.map((s) => s.name).join(" + ") + " \u00b7 "}
            {allVideos.length > 0 ? `${allVideos.length.toLocaleString()} videos` : catalogLoaded ? "No videos" : "Loading..."}
          </p>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  cat.id === activeCategory
                    ? "bg-white text-black font-medium"
                    : "bg-white/10 text-white/60 hover:bg-white/15 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={startPlaying}
            disabled={allVideos.length === 0}
            className="bg-red-600 hover:bg-red-500 disabled:bg-white/10 disabled:text-white/30 text-white text-lg font-semibold px-8 py-3.5 rounded-xl transition-colors flex items-center gap-3"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            Shuffle Play
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            disabled={allVideos.length === 0}
            className="bg-white/10 hover:bg-white/15 disabled:opacity-30 text-white text-lg px-6 py-3.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Search
          </button>
        </div>

        <div className="text-white/20 text-xs text-center mt-10">
          <kbd className="bg-white/5 px-1.5 py-0.5 rounded">Space</kbd> Play
          &nbsp;&middot;&nbsp;
          <kbd className="bg-white/5 px-1.5 py-0.5 rounded">/</kbd> Search
        </div>

        <Search videos={allVideos} onSelect={playVideo} onClose={() => setSearchOpen(false)} visible={searchOpen} />
      </div>
    );
  }

  // ── Player view ──
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="relative" style={{ height: "calc(100vh - 88px)" }}>
        {currentVideo && (
          <Player
            ref={playerRef}
            videoId={currentVideo.id}
            onEnded={playNext}
            onError={handleError}
            onReady={() => setStatus("")}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
          />
        )}
      </div>

      <div className="bg-zinc-950 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-4 py-2">
          <button
            onClick={() => { setMode("lobby"); setCurrentVideo(null); }}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Back to channel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="min-w-0 flex-1">
            {currentVideo && (
              <div>
                <p className="text-white text-sm font-medium truncate">{currentVideo.title}</p>
                <p className="text-white/40 text-xs mt-0.5 flex items-center gap-2">
                  <span className="text-red-500 font-semibold">{config.name}</span>
                  {currentVideo.source && <span className="text-white/30">via {currentVideo.source}</span>}
                  <span>{formatDuration(currentVideo.duration)}</span>
                  {status && <span className="text-yellow-500">{status}</span>}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setSearchOpen(true)} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors" title="Search (/)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button onClick={playPrev} className={`p-2 rounded-lg transition-colors ${historyRef.current.length > 0 ? "text-white/60 hover:text-white hover:bg-white/10" : "text-white/20 cursor-not-allowed"}`} title="Previous (P)">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
            </button>
            <button onClick={() => { playerRef.current?.togglePlay(); setPaused((p) => !p); }} className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors" title="Play/Pause (Space)">
              {paused ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              )}
            </button>
            <button onClick={() => playNext()} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors" title="Next (N)">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
            </button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <button onClick={() => { playerRef.current?.toggleMute(); setMuted((m) => !m); }} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors" title="Mute (M)">
              {muted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
              )}
            </button>
            <button onClick={() => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); }} className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors" title="Fullscreen (F)">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 pb-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                cat.id === activeCategory
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/40 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <Search videos={allVideos} onSelect={playVideo} onClose={() => setSearchOpen(false)} visible={searchOpen} />
    </div>
  );
}
