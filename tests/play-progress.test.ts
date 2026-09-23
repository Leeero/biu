import { beforeEach, describe, expect, test } from "vitest";

import { usePlayProgress } from "@/store/play-progress";

describe("play-progress store", () => {
  beforeEach(() => {
    localStorage.clear();
    usePlayProgress.setState({ currentTime: 0 });
  });

  test("restores persisted progress", () => {
    localStorage.setItem("play-current-time", "37.5");
    expect(usePlayProgress.getState().initCurrentTime()).toBe(37.5);
    expect(usePlayProgress.getState().currentTime).toBe(37.5);
  });

  test("returns zero when no progress was persisted", () => {
    expect(usePlayProgress.getState().initCurrentTime()).toBe(0);
    expect(usePlayProgress.getState().currentTime).toBe(0);
  });

  test("saves the latest non-zero progress", () => {
    usePlayProgress.getState().setCurrentTime(18.25);
    usePlayProgress.getState().saveCurrentTime();
    expect(localStorage.getItem("play-current-time")).toBe("18.25");
  });

  test("does not replace stored progress with a transient zero", () => {
    localStorage.setItem("play-current-time", "18.25");
    usePlayProgress.getState().saveCurrentTime();
    expect(localStorage.getItem("play-current-time")).toBe("18.25");
  });
});
