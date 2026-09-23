import { describe, expect, test } from "vitest";

import { getActiveLyricIndex, parseLyrics } from "@/components/lyrics/model";

describe("lyrics model", () => {
  test("parses, sorts and expands multiple timestamps", () => {
    expect(parseLyrics("[00:12.50][00:20.500]副歌\n[00:03]开场")).toEqual([
      { time: 3000, text: "开场" },
      { time: 12_500, text: "副歌" },
      { time: 20_500, text: "副歌" },
    ]);
  });

  test("selects the lyric at the current playback time", () => {
    const lyrics = parseLyrics("[00:01]第一句\n[00:05]第二句\n[00:10]第三句");
    expect(getActiveLyricIndex([], 2000)).toBe(-1);
    expect(getActiveLyricIndex(lyrics, 0)).toBe(0);
    expect(getActiveLyricIndex(lyrics, 7200)).toBe(1);
    expect(getActiveLyricIndex(lyrics, 12_000)).toBe(2);
  });
});
