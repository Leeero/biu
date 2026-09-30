import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { NOW_PLAYING_PAGE_FIXTURE_NAME, SCREEN_10_NOW_PLAYING_FIXTURE } from "@/ui/fixtures/screen-10-now-playing";

const fixture = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/10-now-playing.json"), "utf8"),
) as Record<string, unknown>;

describe("屏 10 夹具", () => {
  test("应用镜像与视觉比对 JSON 逐字一致", () => {
    expect(NOW_PLAYING_PAGE_FIXTURE_NAME).toBe("10-now-playing");
    expect(SCREEN_10_NOW_PLAYING_FIXTURE).toEqual({
      title: fixture.title,
      meta: fixture.meta,
      qualityMeta: fixture.qualityMeta,
      tags: fixture.tags,
      lyricsHead: fixture.lyricsHead,
      lyrics: fixture.lyrics,
      currentLine: fixture.currentLine,
      note: fixture.note,
      elapsed: fixture.elapsed,
      duration: fixture.duration,
      progress: fixture.progress,
      queueCount: fixture.queueCount,
    });
  });

  test("沉浸页保留三种媒体视图与 16:9 封面语义", () => {
    expect(SCREEN_10_NOW_PLAYING_FIXTURE.note).toContain("16:9");
    expect(SCREEN_10_NOW_PLAYING_FIXTURE.lyrics).toHaveLength(5);
    expect(SCREEN_10_NOW_PLAYING_FIXTURE.currentLine).toBe(2);
  });
});
