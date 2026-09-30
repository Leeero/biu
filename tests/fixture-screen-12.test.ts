import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { MINI_PLAYER_FIXTURE_NAME, SCREEN_12_MINI_PLAYER_FIXTURE } from "@/ui/fixtures/screen-12-mini-player";

const fixture = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/12-mini-player.json"), "utf8"),
) as Record<string, unknown>;

describe("屏 12 夹具", () => {
  test("应用镜像与视觉比对 JSON 逐字一致", () => {
    expect(MINI_PLAYER_FIXTURE_NAME).toBe("12-mini-player");
    const screenData = { ...fixture };
    delete screenData.doc;
    delete screenData.no;
    delete screenData.name;
    delete screenData.route;
    expect(SCREEN_12_MINI_PLAYER_FIXTURE).toEqual(screenData);
  });

  test("系统集成预览保留三类能力与快捷键冲突态", () => {
    expect(SCREEN_12_MINI_PLAYER_FIXTURE.rows).toHaveLength(3);
    expect(SCREEN_12_MINI_PLAYER_FIXTURE.trayItems).toHaveLength(5);
    expect(SCREEN_12_MINI_PLAYER_FIXTURE.conflict).toContain("isConflict");
  });
});
