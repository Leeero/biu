import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import {
  PLAYLIST_DETAIL_FIXTURE_NAME,
  SCREEN_02_PLAYLIST_DETAIL_FIXTURE,
} from "@/ui/fixtures/screen-02-playlist-detail";

/**
 * 屏 02 夹具：应用侧 TS 模块与 verify.py 取数用的 JSON 必须逐字一致。
 * 与屏 01 的做法相同 —— 两份只有一份会漂移，测试就是那条缰绳。
 */
const FIXTURE = path.resolve(process.cwd(), "tools/design-fidelity/fixtures/02-playlist-detail.json");

describe("屏 02 夹具：TS 模块与 JSON 逐字一致", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as typeof SCREEN_02_PLAYLIST_DETAIL_FIXTURE & {
    no: string;
    name: string;
    route: string;
  };

  test("名称与路由对齐 spec-lock 的第 02 屏", () => {
    expect(fixture.no).toBe("02");
    expect(fixture.route).toBe("/collection/:id");
    expect(PLAYLIST_DETAIL_FIXTURE_NAME).toBe("02-playlist-detail");
  });

  test("整份内容一致", () => {
    expect(SCREEN_02_PLAYLIST_DETAIL_FIXTURE).toEqual({
      collectionType: fixture.collectionType,
      header: fixture.header,
      filterPills: fixture.filterPills,
      section: fixture.section,
      tracks: fixture.tracks,
      modal: fixture.modal,
      note: fixture.note,
      nowPlaying: fixture.nowPlaying,
    });
  });

  test("每个曲目的 artIndex 都落在占位渐变清单内", () => {
    const { gradients } = JSON.parse(
      readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/placeholder-art.json"), "utf8"),
    ) as { gradients: string[] };

    for (const track of SCREEN_02_PLAYLIST_DETAIL_FIXTURE.tracks) {
      expect(track.artIndex, `曲目「${track.title}」的 artIndex 越界`).toBeGreaterThanOrEqual(0);
      expect(track.artIndex).toBeLessThan(gradients.length);
    }
  });

  test("四行曲目，仅第 04 行为操作带演示位", () => {
    expect(SCREEN_02_PLAYLIST_DETAIL_FIXTURE.tracks).toHaveLength(4);
    // 设计稿第 3 页没有当前行高亮（行内背景 8.23 vs 行外 8.00），第 04 行只是
    // 操作带常驻露出的演示行 —— 夹具不得把它声明成当前行。
    expect(SCREEN_02_PLAYLIST_DETAIL_FIXTURE.tracks.filter(track => track.demoActions)).toHaveLength(1);
    expect(SCREEN_02_PLAYLIST_DETAIL_FIXTURE.tracks[3]?.demoActions).toBe(true);
    expect("current" in SCREEN_02_PLAYLIST_DETAIL_FIXTURE.tracks[3]!).toBe(false);
  });

  test("右列逐行对齐设计稿的可见行（第 1 行被弹层遮挡）", () => {
    const cells = SCREEN_02_PLAYLIST_DETAIL_FIXTURE.tracks.map(track => [track.cell, track.duration]);
    expect(cells).toEqual([
      ["收藏于 09-21 · 分P 1/1", "03:18"],
      ["收藏于 09-21 · 分P 1/1", "03:18"],
      ["收藏于 09-18 · 分P 1/2", "02:47"],
      ["收藏于 09-12 · 分P 1/1", "05:11"],
    ]);
  });
});
