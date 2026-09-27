import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { LIBRARY_FIXTURE_NAME, LIBRARY_TILE_ACTIONS, SCREEN_01_LIBRARY_FIXTURE } from "@/ui/fixtures/screen-01-library";

/**
 * 屏 01 夹具：应用侧 TS 模块与 verify.py 取数用的 JSON 必须逐字一致。
 * 与 placeholder-art 的做法相同 —— 两份只有一份会漂移，测试就是那条缰绳。
 */
const FIXTURE = path.resolve(process.cwd(), "tools/design-fidelity/fixtures/01-library.json");

describe("屏 01 夹具：TS 模块与 JSON 逐字一致", () => {
  const fixture = JSON.parse(readFileSync(FIXTURE, "utf8")) as typeof SCREEN_01_LIBRARY_FIXTURE & {
    no: string;
    name: string;
    route: string;
  };

  test("名称与路由对齐 spec-lock 的第 01 屏", () => {
    expect(fixture.no).toBe("01");
    expect(fixture.route).toBe("/library");
    expect(LIBRARY_FIXTURE_NAME).toBe("01-library");
  });

  test("整份内容一致", () => {
    expect(SCREEN_01_LIBRARY_FIXTURE).toEqual({
      user: fixture.user,
      library: fixture.library,
      nowPlaying: fixture.nowPlaying,
    });
  });

  test("每个瓦片的 artIndex 都落在占位渐变清单内", () => {
    const { gradients } = JSON.parse(
      readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/placeholder-art.json"), "utf8"),
    ) as { gradients: string[] };

    for (const tile of [...SCREEN_01_LIBRARY_FIXTURE.library.created, ...SCREEN_01_LIBRARY_FIXTURE.library.collected]) {
      expect(tile.artIndex, `瓦片「${tile.title}」的 artIndex 越界`).toBeGreaterThanOrEqual(0);
      expect(tile.artIndex).toBeLessThan(gradients.length);
    }
  });

  test("操作带是设计稿注解的那五个主操作", () => {
    expect(LIBRARY_TILE_ACTIONS.map(action => action.label)).toEqual(["播放", "下一首", "入队", "收藏", "下载音频"]);
  });
});
