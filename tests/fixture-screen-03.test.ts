import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { SCREEN_03_WATCH_LATER_FIXTURE, WATCH_LATER_FIXTURE_NAME } from "@/ui/fixtures/screen-03-watch-later";

/**
 * 屏 03 夹具：应用侧 TS 模块与 verify.py 取数用的 JSON 必须逐字一致。
 * 与屏 01/02 的做法相同 —— 两份只有一份会漂移，测试就是那条缰绳。
 */
const FIXTURE = path.resolve(process.cwd(), "tools/design-fidelity/fixtures/03-watch-later.json");

describe("屏 03 夹具：TS 模块与 JSON 逐字一致", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as typeof SCREEN_03_WATCH_LATER_FIXTURE & {
    no: string;
    name: string;
    route: string;
  };

  test("名称与路由对齐 spec-lock 的第 03 屏", () => {
    expect(fixture.no).toBe("03");
    expect(fixture.route).toBe("/later");
    expect(WATCH_LATER_FIXTURE_NAME).toBe("03-watch-later");
  });

  test("整份内容一致", () => {
    expect(SCREEN_03_WATCH_LATER_FIXTURE).toEqual({
      header: fixture.header,
      panel: fixture.panel,
      filterPills: fixture.filterPills,
      section: fixture.section,
      tracks: fixture.tracks,
      note: fixture.note,
      nowPlaying: fixture.nowPlaying,
    });
  });

  test("每个曲目的 artIndex 都落在占位渐变清单内", () => {
    const { gradients } = JSON.parse(
      readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/placeholder-art.json"), "utf8"),
    ) as { gradients: string[] };

    for (const track of SCREEN_03_WATCH_LATER_FIXTURE.tracks) {
      expect(track.artIndex, `曲目「${track.title}」的 artIndex 越界`).toBeGreaterThanOrEqual(0);
      expect(track.artIndex).toBeLessThan(gradients.length);
    }
  });

  test("四行曲目，仅第 04 行为操作带演示位", () => {
    expect(SCREEN_03_WATCH_LATER_FIXTURE.tracks).toHaveLength(4);
    expect(SCREEN_03_WATCH_LATER_FIXTURE.tracks.filter(track => track.demoActions)).toHaveLength(1);
    expect(SCREEN_03_WATCH_LATER_FIXTURE.tracks[3]?.demoActions).toBe(true);
  });

  test("右两列逐行对齐设计稿第 4 页的可见行", () => {
    const cells = SCREEN_03_WATCH_LATER_FIXTURE.tracks.map(track => [track.cell, track.progress]);
    expect(cells).toEqual([
      ["@音乐区 UP · 09-23 14:22", "62%"],
      ["@猎 Hunter · 09-21 09:07", "未看"],
      ["@搞丸君 · 09-18 22:41", "未看"],
      ["@阿岚同学 · 09-12 18:03", "04:11"],
    ]);
  });

  test("表头四列与 spec-lock 的 base 变体逐列对应", () => {
    // 第三列「UP 主 · 加入时间」占 col-4(220)，第四列「进度」占 col-5(152)。
    // 表头列数必须等于列模板的列数，否则表头与行会错位而没有任何闸门发现。
    expect(SCREEN_03_WATCH_LATER_FIXTURE.section.head).toEqual(["#", "标题", "UP 主 · 加入时间", "进度"]);
  });
});
