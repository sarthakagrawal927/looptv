import { describe, it, expect } from "vitest";
import { formatDuration, pickRandom, getVideosForStation } from "../catalog";
import type { Video, Catalog } from "../types";

// ---------- formatDuration ----------

describe("formatDuration", () => {
  it("formats 120 seconds as 2:00", () => {
    expect(formatDuration(120)).toBe("2:00");
  });

  it("formats 3661 seconds as 1:01:01", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("formats 0 seconds as 0:00", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("formats 59 seconds as 0:59", () => {
    expect(formatDuration(59)).toBe("0:59");
  });

  it("formats 3600 seconds as 1:00:00", () => {
    expect(formatDuration(3600)).toBe("1:00:00");
  });
});

// ---------- pickRandom ----------

function makeVideo(id: string): Video {
  return { id, title: `Video ${id}`, duration: 60, date: "", tags: [] };
}

describe("pickRandom", () => {
  it("returns null for an empty array", () => {
    expect(pickRandom([])).toBeNull();
  });

  it("returns the only video when array has one element", () => {
    const video = makeVideo("v1");
    expect(pickRandom([video])).toBe(video);
  });

  it("excludes the specified video id", () => {
    const v1 = makeVideo("v1");
    const v2 = makeVideo("v2");
    const result = pickRandom([v1, v2], v1.id);
    expect(result).toBe(v2);
  });

  it("returns null when all videos are excluded", () => {
    const v1 = makeVideo("v1");
    expect(pickRandom([v1], v1.id)).toBeNull();
  });
});

// ---------- getVideosForStation ----------

function makeCatalog(): Catalog {
  const videos: Video[] = [
    { id: "a", title: "Alpha", duration: 100, date: "", tags: ["fun"] },
    { id: "b", title: "Beta", duration: 200, date: "", tags: ["serious"] },
    { id: "c", title: "Gamma", duration: 300, date: "", tags: ["fun"] },
  ];

  return {
    lastUpdated: "2026-01-01",
    stations: {
      testStation: {
        videos,
        categoryVideoIds: {
          fun: ["a", "c"],
          serious: ["b"],
        },
      },
    },
  };
}

describe("getVideosForStation", () => {
  it('returns all videos when categoryId is "all"', () => {
    const catalog = makeCatalog();
    const result = getVideosForStation(catalog, "testStation", "all");
    expect(result).toHaveLength(3);
    expect(result.map((v) => v.id)).toEqual(["a", "b", "c"]);
  });

  it("returns filtered videos for a specific category", () => {
    const catalog = makeCatalog();
    const result = getVideosForStation(catalog, "testStation", "fun");
    expect(result).toHaveLength(2);
    expect(result.map((v) => v.id)).toEqual(["a", "c"]);
  });

  it("returns single video for a single-entry category", () => {
    const catalog = makeCatalog();
    const result = getVideosForStation(catalog, "testStation", "serious");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("b");
  });

  it("returns empty array for an unknown station", () => {
    const catalog = makeCatalog();
    const result = getVideosForStation(catalog, "nonexistent", "all");
    expect(result).toEqual([]);
  });

  it("returns empty array for an unknown category", () => {
    const catalog = makeCatalog();
    const result = getVideosForStation(catalog, "testStation", "nope");
    expect(result).toEqual([]);
  });
});
