import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { DOWNLOADS_FIXTURE_NAME, SCREEN_05_DOWNLOADS_FIXTURE } from "@/ui/fixtures/screen-05-downloads";

const fixture = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "tools/design-fidelity/fixtures/05-downloads.json"), "utf8"),
);

describe("屏 05 夹具", () => {
  test("应用镜像与视觉比对 JSON 逐字一致", () => {
    expect(DOWNLOADS_FIXTURE_NAME).toBe("05-downloads");
    expect(SCREEN_05_DOWNLOADS_FIXTURE).toEqual({
      header: fixture.header,
      filterPills: fixture.filterPills,
      section: fixture.section,
      tasks: fixture.tasks,
      note: fixture.note,
      nowPlaying: fixture.nowPlaying,
    });
  });

  test("四行覆盖进行中、处理、完成与失败状态", () => {
    expect(SCREEN_05_DOWNLOADS_FIXTURE.tasks.map(task => task.status)).toEqual([
      "下载中 · 62%",
      "合并分块中 · 40%",
      "已完成 · 可定位文件",
      "任务出错 · 可重试",
    ]);
  });
});
