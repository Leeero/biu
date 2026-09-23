import { describe, expect, test } from "vitest";

import type { PlayData } from "@/store/play-list";

import { getQueueIdentity, getUniqueQueueItems } from "@/features/player/queue";

const queue: PlayData[] = [
  { id: "local-1", source: "local", type: "audio", title: "本地歌曲" },
  { id: "local-1", source: "local", type: "audio", title: "本地歌曲副本" },
  { id: "mv-1", source: "online", type: "mv", bvid: "BV1", title: "视频歌曲" },
  { id: "mv-2", source: "online", type: "mv", bvid: "BV1", title: "视频歌曲分集" },
  { id: "audio-1", source: "online", type: "audio", sid: 10, title: "音频歌曲" },
  { id: "audio-2", source: "online", type: "audio", sid: 10, title: "音频歌曲副本" },
];

describe("player queue view model", () => {
  test("uses source-specific stable identities", () => {
    expect(getQueueIdentity(queue[0])).toBe("local:local-1");
    expect(getQueueIdentity(queue[2])).toBe("mv:BV1");
    expect(getQueueIdentity(queue[4])).toBe("audio:10");
  });

  test("keeps the first visible item for every unique track", () => {
    expect(getUniqueQueueItems(queue).map(item => item.id)).toEqual(["local-1", "mv-1", "audio-1"]);
  });
});
