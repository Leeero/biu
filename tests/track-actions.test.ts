import { describe, expect, it, vi } from "vitest";

import type { Track } from "@/domain/track";

import { createTrackActionExecutor } from "@/features/track/actions";

const track: Track = {
  id: "bilibili-video:BV1",
  source: "bilibili-video",
  title: "Track",
  sourceRef: { aid: "1", bvid: "BV1" },
};

describe("track action executor", () => {
  it("routes queue and download actions through shared dependencies", async () => {
    const dependencies = {
      play: vi.fn(),
      playNext: vi.fn(),
      addToQueue: vi.fn(),
      favorite: vi.fn(() => true),
      download: vi.fn(async () => true),
      openSource: vi.fn(() => true),
    };
    const execute = createTrackActionExecutor(dependencies);

    await execute("play-next", track);
    await execute("add-to-playlist", track);
    await execute("download-audio", track);

    expect(dependencies.playNext).toHaveBeenCalledWith(track);
    expect(dependencies.addToQueue).toHaveBeenCalledWith(track);
    expect(dependencies.download).toHaveBeenCalledWith(track, "audio");
  });

  it("forwards the favorite success callback", async () => {
    const onFavoriteSuccess = vi.fn();
    const favorite = vi.fn(() => true);
    const execute = createTrackActionExecutor({
      play: vi.fn(),
      playNext: vi.fn(),
      addToQueue: vi.fn(),
      favorite,
      download: vi.fn(async () => true),
      openSource: vi.fn(() => true),
    });

    expect(await execute("favorite", track, { onFavoriteSuccess })).toBe(true);
    expect(favorite).toHaveBeenCalledWith(track, onFavoriteSuccess);
  });
});
