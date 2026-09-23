import { describe, expect, test, vi } from "vitest";

import { createMiniPlayerActions } from "@/pages/mini-player/actions";

describe("mini player actions", () => {
  test("maps compact player controls to existing broadcast commands", () => {
    const postMessage = vi.fn();
    const actions = createMiniPlayerActions(postMessage);

    actions.initialize();
    actions.seek(18.5);
    actions.togglePlayMode();
    actions.previous();
    actions.togglePlay();
    actions.next();

    expect(postMessage.mock.calls.map(([message]) => message.data)).toEqual([
      { type: "init" },
      { type: "seek", state: { currentTime: 18.5 } },
      { type: "togglePlayMode" },
      { type: "prev" },
      { type: "togglePlay" },
      { type: "next" },
    ]);
  });
});
