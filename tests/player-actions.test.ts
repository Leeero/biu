import { describe, expect, test, vi } from "vitest";

import { createPlayerActions } from "@/features/player/use-player-actions";

describe("player action api", () => {
  test("delegates every action to the existing player and modal capabilities", async () => {
    const dependencies = {
      togglePlay: vi.fn(),
      previous: vi.fn(async () => undefined),
      next: vi.fn(async () => undefined),
      seek: vi.fn(),
      playQueueItem: vi.fn(async () => undefined),
      removeQueueItem: vi.fn(),
      clearQueue: vi.fn(),
      togglePlayMode: vi.fn(),
      openQueue: vi.fn(),
      openNowPlaying: vi.fn(),
    };
    const actions = createPlayerActions(dependencies);

    actions.togglePlay();
    await actions.previous();
    await actions.next();
    actions.seek(42);
    await actions.playQueueItem("track-1");
    actions.removeQueueItem("track-1");
    actions.clearQueue();
    actions.togglePlayMode();
    actions.openQueue();
    actions.openNowPlaying();

    expect(dependencies.togglePlay).toHaveBeenCalledOnce();
    expect(dependencies.previous).toHaveBeenCalledOnce();
    expect(dependencies.next).toHaveBeenCalledOnce();
    expect(dependencies.seek).toHaveBeenCalledWith(42);
    expect(dependencies.playQueueItem).toHaveBeenCalledWith("track-1");
    expect(dependencies.removeQueueItem).toHaveBeenCalledWith("track-1");
    expect(dependencies.clearQueue).toHaveBeenCalledOnce();
    expect(dependencies.togglePlayMode).toHaveBeenCalledOnce();
    expect(dependencies.openQueue).toHaveBeenCalledOnce();
    expect(dependencies.openNowPlaying).toHaveBeenCalledOnce();
  });
});
