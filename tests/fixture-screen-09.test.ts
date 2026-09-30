import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { QUEUE_FIXTURE_NAME, SCREEN_09_QUEUE_FIXTURE } from "@/ui/fixtures/screen-09-queue";

const fixture = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/09-queue.json"), "utf8"),
);

describe("屏 09 夹具", () => {
  test("应用镜像与视觉比对 JSON 逐字一致", () => {
    expect(QUEUE_FIXTURE_NAME).toBe("09-queue");
    expect(SCREEN_09_QUEUE_FIXTURE).toEqual({
      header: fixture.header,
      filterPills: fixture.filterPills,
      section: fixture.section,
      tracks: fixture.tracks,
      note: fixture.note,
      nowPlaying: fixture.nowPlaying,
    });
  });
  test("当前行与演示操作行分别落在设计稿位置", () => {
    expect(SCREEN_09_QUEUE_FIXTURE.tracks.find(track => "current" in track)?.index).toBe(1);
    expect(SCREEN_09_QUEUE_FIXTURE.tracks.find(track => "demoActions" in track)?.index).toBe(4);
  });
});
