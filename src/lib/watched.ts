const WATCHED_KEY = "looptv_watched";
const STATS_KEY = "looptv_stats";
const BLOCKED_KEY = "looptv_blocked_sources";

export interface WatchStats {
  totalWatched: number;
  totalSeconds: number;
  byStation: Record<string, number>;
  bySource: Record<string, number>;
  lastWatched: string; // ISO date
}

function defaultStats(): WatchStats {
  return {
    totalWatched: 0,
    totalSeconds: 0,
    byStation: {},
    bySource: {},
    lastWatched: "",
  };
}

export function getWatchedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(WATCHED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markWatched(
  videoId: string,
  duration: number,
  stationId: string,
  source: string
): void {
  if (typeof window === "undefined") return;

  // Add to watched set
  const ids = getWatchedIds();
  if (ids.has(videoId)) return; // already tracked
  ids.add(videoId);
  localStorage.setItem(WATCHED_KEY, JSON.stringify([...ids]));

  // Update stats
  const stats = getStats();
  stats.totalWatched++;
  stats.totalSeconds += duration;
  stats.byStation[stationId] = (stats.byStation[stationId] || 0) + 1;
  stats.bySource[source] = (stats.bySource[source] || 0) + 1;
  stats.lastWatched = new Date().toISOString();
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getStats(): WatchStats {
  if (typeof window === "undefined") return defaultStats();
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...defaultStats(), ...JSON.parse(raw) } : defaultStats();
  } catch {
    return defaultStats();
  }
}

export function clearWatched(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(WATCHED_KEY);
  localStorage.removeItem(STATS_KEY);
}

export function getBlockedSources(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function blockSource(source: string): void {
  if (typeof window === "undefined") return;
  const blocked = getBlockedSources();
  blocked.add(source);
  localStorage.setItem(BLOCKED_KEY, JSON.stringify([...blocked]));
}

export function unblockSource(source: string): void {
  if (typeof window === "undefined") return;
  const blocked = getBlockedSources();
  blocked.delete(source);
  localStorage.setItem(BLOCKED_KEY, JSON.stringify([...blocked]));
}
