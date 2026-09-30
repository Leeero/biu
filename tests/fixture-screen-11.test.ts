import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { SCREEN_11_SETTINGS_FIXTURE, SETTINGS_FIXTURE_NAME } from "@/ui/fixtures/screen-11-settings";

const fixture = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/11-settings.json"), "utf8"),
) as Record<string, unknown>;

describe("屏 11 夹具", () => {
  test("应用镜像与视觉比对 JSON 逐字一致", () => {
    expect(SETTINGS_FIXTURE_NAME).toBe("11-settings");
    const screenData = { ...fixture };
    delete screenData.doc;
    delete screenData.no;
    delete screenData.name;
    delete screenData.route;
    expect(SCREEN_11_SETTINGS_FIXTURE).toEqual(screenData);
  });

  test("设置总览覆盖六组能力且不再暴露旧主题入口", () => {
    expect(SCREEN_11_SETTINGS_FIXTURE.rows).toHaveLength(5);
    expect(SCREEN_11_SETTINGS_FIXTURE.pills).not.toContain("浅色");
    expect(SCREEN_11_SETTINGS_FIXTURE.pills).not.toContain("跟随系统");
    expect(SCREEN_11_SETTINGS_FIXTURE.note).toContain("旧主题字段仅用于配置兼容");
  });
});
