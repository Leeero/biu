import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { LOCAL_MUSIC_FIXTURE_NAME, SCREEN_04_LOCAL_MUSIC_FIXTURE } from "@/ui/fixtures/screen-04-local-music";

const fixture = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/04-local-music.json"), "utf8"),
);

describe("屏 04 夹具", () => {
  test("应用镜像与视觉比对 JSON 逐字一致", () => {
    expect(LOCAL_MUSIC_FIXTURE_NAME).toBe("04-local-music");
    expect(SCREEN_04_LOCAL_MUSIC_FIXTURE).toEqual({
      header: fixture.header,
      filterPills: fixture.filterPills,
      cards: fixture.cards,
      note: fixture.note,
      nowPlaying: fixture.nowPlaying,
    });
  });

  test("六张格式卡覆盖设计稿的六种格式且不携带伪造封面", () => {
    expect(SCREEN_04_LOCAL_MUSIC_FIXTURE.cards.map(card => card.format)).toEqual([
      "flac",
      "wav",
      "mp3",
      "aiff",
      "m4a",
      "wma",
    ]);
    for (const card of SCREEN_04_LOCAL_MUSIC_FIXTURE.cards) expect(card).not.toHaveProperty("cover");
  });
});
