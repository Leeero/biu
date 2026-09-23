import { describe, expect, test } from "vitest";

import { getOptimizedBackgroundImageUrl } from "@/components/full-screen-player/glassmorphism";

describe("full screen player performance helpers", () => {
  test("requests a bounded image for bilibili blurred backgrounds", () => {
    expect(getOptimizedBackgroundImageUrl("https://i0.hdslb.com/bfs/archive/cover.jpg")).toBe(
      "https://i0.hdslb.com/bfs/archive/cover.jpg@672w_378h_1c.avif",
    );
  });

  test("preserves already transformed and non-bilibili images", () => {
    expect(getOptimizedBackgroundImageUrl("https://i0.hdslb.com/bfs/archive/cover.jpg@320w.webp")).toBe(
      "https://i0.hdslb.com/bfs/archive/cover.jpg@320w.webp",
    );
    expect(getOptimizedBackgroundImageUrl("file:///Users/demo/Music/cover.jpg")).toBe(
      "file:///Users/demo/Music/cover.jpg",
    );
  });
});
