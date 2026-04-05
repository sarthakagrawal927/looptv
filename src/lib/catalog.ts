import type { Catalog, Video } from "./types";

let catalogCache: Catalog | null = null;

export async function loadCatalog(): Promise<Catalog> {
  if (catalogCache) return catalogCache;
  const res = await fetch("/catalog.json");
  if (!res.ok) throw new Error(`Failed to load catalog: ${res.status}`);
  catalogCache = await res.json();
  return catalogCache!;
}

export function getVideosForStation(
  catalog: Catalog,
  stationId: string,
  categoryId: string
): Video[] {
  if (stationId === "all") {
    return Object.values(catalog.stations).flatMap((s) => s.videos);
  }

  const station = catalog.stations[stationId];
  if (!station) return [];

  if (categoryId === "all") return station.videos;

  const ids = station.categoryVideoIds[categoryId];
  if (!ids) return [];

  const idSet = new Set(ids);
  return station.videos.filter((v) => idSet.has(v.id));
}

export function pickRandom(videos: Video[], exclude?: string): Video | null {
  const filtered = exclude ? videos.filter((v) => v.id !== exclude) : videos;
  if (filtered.length === 0) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
