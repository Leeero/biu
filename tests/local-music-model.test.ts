import { describe, expect, it } from "vitest";

import { createLocalTrackEntries, filterLocalMusic, getLocalDirectoryName } from "@/features/local-music/model";

const items = [
  { id: "1", title: "First Song", path: "/Music/A/first.mp3", dir: "/Music/A", size: 1 },
  { id: "2", title: "Second Song", path: "/Music/B/second.flac", dir: "/Music/B", size: 2 },
] as LocalMusicItem[];

describe("local music model", () => {
  it("combines directory and case-insensitive title filters", () => {
    expect(filterLocalMusic(items, "/Music/A", "FIRST")).toEqual([items[0]]);
    expect(filterLocalMusic(items, "/Music/A", "second")).toEqual([]);
  });

  it("creates local tracks with playable file URLs", () => {
    expect(createLocalTrackEntries([items[0]])[0].track).toMatchObject({
      id: "local:1",
      source: "local",
      sourceRef: { localPath: "/Music/A/first.mp3", audioUrl: "file:///Music/A/first.mp3" },
    });
  });

  it("extracts directory names across path separators", () => {
    expect(getLocalDirectoryName("/Music/A/")).toBe("A");
    expect(getLocalDirectoryName("C:\\Music\\B\\")).toBe("B");
  });
});
