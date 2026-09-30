import { describe, expect, test } from "vitest";

import type { ToViewVideoItem } from "@/service/history-toview-list";

import { adaptWatchLaterToTrack } from "@/adapters/track/watch-later";
import { adaptWatchLaterEntry, formatWatchProgress } from "@/features/later/model";

const item = {
  aid: 123,
  bvid: "BV1later",
  cid: 456,
  title: "连续八个汉字正文取证样本",
  pic: "https://example.com/cover.jpg",
  owner: { mid: 789, name: "音乐区 UP", face: "" },
  duration: 240,
  progress: 150,
  add_at: 1_780_000_000,
  pubdate: 1_770_000_000,
  tname: "音乐综合",
  videos: 2,
  stat: { view: 12_345 },
} as ToViewVideoItem;

describe("稍后播放领域适配", () => {
  test("保留统一 Track 动作所需的 aid / bvid / cid", () => {
    expect(adaptWatchLaterToTrack(item)).toMatchObject({
      id: "bilibili-video:BV1later",
      source: "bilibili-video",
      creator: { id: "789", name: "音乐区 UP" },
      sourceRef: { aid: "123", bvid: "BV1later", cid: "456" },
    });
  });

  test("未看、观看中、已看完分别映射为文案与量化进度", () => {
    expect(formatWatchProgress(0, 240)).toEqual({ label: "未看" });
    expect(formatWatchProgress(150, 240)).toEqual({ label: "63%", percent: 63 });
    expect(formatWatchProgress(240, 240)).toEqual({ label: "04:00", percent: 100 });
  });

  test("页面视图模型包含分区、分P、UP 主、加入时间与进度", () => {
    const entry = adaptWatchLaterEntry(item, 2);
    expect(entry.index).toBe(3);
    expect(entry.subtitle).toContain("音乐综合 · 分P 1/2");
    expect(entry.cell).toMatch(/^@音乐区 UP · \d{2}-\d{2} \d{2}:\d{2}$/);
    expect(entry.progress).toBe("63%");
    expect(entry.progressPercent).toBe(63);
  });
});
