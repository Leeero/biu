import { describe, expect, test } from "vitest";

import type { PlayData } from "@/store/play-list";

import { buildQueueViewModel } from "@/features/player/queue";

const online = (id: string, overrides: Partial<PlayData> = {}): PlayData => ({
  id,
  title: `歌曲 ${id}`,
  type: "mv",
  bvid: `BV-${id}`,
  source: "online",
  duration: 125,
  ownerName: "创作者",
  ...overrides,
});

describe("4188 共享队列视图模型", () => {
  test("按播放身份去重，并统一当前项与下一首状态", () => {
    const rows = buildQueueViewModel([online("1"), online("duplicate", { bvid: "BV-1" }), online("2")], "1", "2");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: "1", index: 1, isCurrent: true, duration: "02:05" });
    expect(rows[1]).toMatchObject({ id: "2", index: 2, isNext: true });
  });

  test("保留本地来源和多分P信息供抽屉、全页及沉浸页共用", () => {
    const [row] = buildQueueViewModel([
      online("local", { source: "local", pageTitle: "第二分集", pageIndex: 2, totalPage: 4 }),
    ]);

    expect(row).toMatchObject({
      title: "第二分集",
      artist: "本地音乐",
      sourceLabel: "本地文件",
      partLabel: "多分P 2/4",
    });
  });
});
