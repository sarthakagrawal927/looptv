import { describe, it, expect, beforeEach, vi } from "vitest";
import { getWatchedIds, markWatched, getStats, clearWatched } from "../watched";

// Mock localStorage
const store: Record<string, string> = {};

const localStorageMock: Storage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key];
  }),
  clear: vi.fn(() => {
    for (const key of Object.keys(store)) delete store[key];
  }),
  get length() {
    return Object.keys(store).length;
  },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
};

// The watched.ts module checks `typeof window` to guard SSR.
// We need both `window` and `localStorage` available.
beforeEach(() => {
  // Clear backing store between tests
  for (const key of Object.keys(store)) delete store[key];
  vi.stubGlobal("window", { localStorage: localStorageMock });
  vi.stubGlobal("localStorage", localStorageMock);
  vi.clearAllMocks();
});

describe("getWatchedIds", () => {
  it("returns an empty Set when nothing is stored", () => {
    const ids = getWatchedIds();
    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(0);
  });

  it("returns stored ids after markWatched", () => {
    markWatched("vid1", 120, "station1", "YouTube");
    const ids = getWatchedIds();
    expect(ids.has("vid1")).toBe(true);
  });
});

describe("markWatched", () => {
  it("adds a video id to the watched set", () => {
    markWatched("v1", 60, "s1", "src1");
    const ids = getWatchedIds();
    expect(ids.has("v1")).toBe(true);
    expect(ids.size).toBe(1);
  });

  it("does not double-count a video that is already watched", () => {
    markWatched("v1", 60, "s1", "src1");
    markWatched("v1", 60, "s1", "src1");
    const ids = getWatchedIds();
    expect(ids.size).toBe(1);
    const stats = getStats();
    expect(stats.totalWatched).toBe(1);
  });

  it("tracks multiple distinct videos", () => {
    markWatched("v1", 60, "s1", "src1");
    markWatched("v2", 90, "s1", "src1");
    const ids = getWatchedIds();
    expect(ids.size).toBe(2);
  });
});

describe("getStats", () => {
  it("returns default stats when nothing is stored", () => {
    const stats = getStats();
    expect(stats.totalWatched).toBe(0);
    expect(stats.totalSeconds).toBe(0);
    expect(stats.byStation).toEqual({});
    expect(stats.bySource).toEqual({});
    expect(stats.lastWatched).toBe("");
  });

  it("returns correct totals after marking videos", () => {
    markWatched("v1", 100, "s1", "YouTube");
    markWatched("v2", 200, "s2", "Vimeo");
    const stats = getStats();
    expect(stats.totalWatched).toBe(2);
    expect(stats.totalSeconds).toBe(300);
    expect(stats.byStation).toEqual({ s1: 1, s2: 1 });
    expect(stats.bySource).toEqual({ YouTube: 1, Vimeo: 1 });
    expect(stats.lastWatched).not.toBe("");
  });

  it("aggregates counts per station", () => {
    markWatched("v1", 60, "snl", "src1");
    markWatched("v2", 60, "snl", "src1");
    markWatched("v3", 60, "comedy", "src1");
    const stats = getStats();
    expect(stats.byStation.snl).toBe(2);
    expect(stats.byStation.comedy).toBe(1);
  });
});

describe("clearWatched", () => {
  it("resets watched ids and stats", () => {
    markWatched("v1", 120, "s1", "src1");
    expect(getWatchedIds().size).toBe(1);
    expect(getStats().totalWatched).toBe(1);

    clearWatched();

    expect(getWatchedIds().size).toBe(0);
    expect(getStats().totalWatched).toBe(0);
  });
});
