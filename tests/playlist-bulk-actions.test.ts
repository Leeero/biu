import { describe, expect, it, vi } from "vitest";

import type { Track } from "@/domain/track";

import { createPlaylistBulkActionExecutor } from "@/features/playlist/bulk-actions";

const tracks: Track[] = [
  { id: "bilibili-video:BV1", source: "bilibili-video", title: "One", sourceRef: { bvid: "BV1" } },
  { id: "bilibili-audio:2", source: "bilibili-audio", title: "Two", sourceRef: { sid: 2 } },
];

describe("playlist bulk actions", () => {
  it("maps all tracks before replacing the playback queue", async () => {
    const playAll = vi.fn();
    const execute = createPlaylistBulkActionExecutor({ playAll, addAll: vi.fn(), notifyAdded: vi.fn() });
    expect(await execute("play-all", tracks)).toBe(true);
    expect(playAll).toHaveBeenCalledWith([
      expect.objectContaining({ type: "mv", bvid: "BV1" }),
      expect.objectContaining({ type: "audio", sid: 2 }),
    ]);
  });

  it("does not mutate the queue for an empty playlist", async () => {
    const addAll = vi.fn();
    const execute = createPlaylistBulkActionExecutor({ playAll: vi.fn(), addAll, notifyAdded: vi.fn() });
    expect(await execute("add-all", [])).toBe(false);
    expect(addAll).not.toHaveBeenCalled();
  });
});
