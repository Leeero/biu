import { describe, expect, it } from "vitest";

import { adaptCollectionMediaToTrack } from "@/features/playlist/tracks";

describe("playlist track adapters", () => {
  it("maps collection media to the shared Track model", () => {
    expect(
      adaptCollectionMediaToTrack({
        id: 10,
        bvid: "BV10",
        title: "Live",
        cover: "cover",
        duration: 180,
        pubtime: 1_700_000_000,
        upper: { mid: 20, name: "Artist" },
        cnt_info: { play: 30, collect: 0, danmaku: 0, vt: 0 },
        enable_vt: 0,
        vt_display: "",
        is_self_view: false,
      }),
    ).toMatchObject({
      id: "bilibili-video:BV10",
      creator: { id: "20", name: "Artist" },
      sourceRef: { aid: "10", bvid: "BV10" },
    });
  });
});
