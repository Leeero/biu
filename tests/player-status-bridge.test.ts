import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/common/utils/audio", () => ({
  getAudioUrl: vi.fn(async () => ({ audioUrl: "https://audio.test/a.mp3", isLossless: false })),
  getDashUrl: vi.fn(async () => ({
    audioUrl: "https://video.test/a.mp3",
    videoUrl: "https://video.test/v.mp4",
    isLossless: false,
  })),
  getMVUrl: vi.fn(async () => ({
    audioUrl: "https://video.test/a.mp3",
    videoUrl: "https://video.test/v.mp4",
    isLossless: false,
  })),
  isUrlValid: vi.fn(url => typeof url === "string" && url.length > 0),
}));

vi.mock("@/common/utils/play-report", () => ({
  beginPlayReport: vi.fn(async () => undefined),
  endPlayReport: vi.fn(),
  reportHeartbeat: vi.fn(async () => undefined),
}));

import { startPlayerStatusBridge } from "@/common/utils/player-status-bridge";
import { usePlayList } from "@/store/play-list";

const updatePlayerStatus = vi.fn();

const localItem = (id: string, title: string) => ({
  id,
  type: "audio" as const,
  source: "local" as const,
  title,
  audioUrl: `file:///music/${id}.mp3`,
});

/** 安装最小 electron 桥；返回值用于在用例结束时还原 */
const installElectronStub = () => {
  const previous = (window as unknown as { electron: unknown }).electron;
  (window as unknown as { electron: unknown }).electron = { updatePlayerStatus };

  return () => {
    (window as unknown as { electron: unknown }).electron = previous;
  };
};

let restoreElectron: () => void;

beforeEach(() => {
  vi.clearAllMocks();
  window.location.hash = "";
  restoreElectron = installElectronStub();
  usePlayList.setState({
    isPlaying: false,
    isMuted: false,
    volume: 0.5,
    list: [],
    playId: undefined,
  });
});

describe("播放状态桥", () => {
  test("启动时立即推送一次当前状态，菜单初始态就是对的", () => {
    usePlayList.setState({ list: [localItem("a", "第一首")], playId: "a", isPlaying: true });

    const stop = startPlayerStatusBridge();

    expect(updatePlayerStatus).toHaveBeenCalledTimes(1);
    expect(updatePlayerStatus).toHaveBeenLastCalledWith({
      isPlaying: true,
      isMuted: false,
      volume: 0.5,
      title: "第一首",
      artist: "本地音乐",
    });

    stop();
    restoreElectron();
  });

  test("相关字段变化时再次推送", () => {
    const stop = startPlayerStatusBridge();
    expect(updatePlayerStatus).toHaveBeenCalledTimes(1);

    usePlayList.setState({ isPlaying: true });
    expect(updatePlayerStatus).toHaveBeenCalledTimes(2);
    expect(updatePlayerStatus).toHaveBeenLastCalledWith(expect.objectContaining({ isPlaying: true }));

    usePlayList.setState({ volume: 0.8, isMuted: true });
    expect(updatePlayerStatus).toHaveBeenCalledTimes(3);
    expect(updatePlayerStatus).toHaveBeenLastCalledWith(expect.objectContaining({ volume: 0.8, isMuted: true }));

    stop();
    restoreElectron();
  });

  test("与菜单无关的变化不推送（避免高频刷屏）", () => {
    const stop = startPlayerStatusBridge();
    expect(updatePlayerStatus).toHaveBeenCalledTimes(1);

    usePlayList.setState({ duration: 233 });
    usePlayList.setState({ rate: 1.5 });
    expect(updatePlayerStatus).toHaveBeenCalledTimes(1);

    stop();
    restoreElectron();
  });

  test("取消订阅后不再推送", () => {
    const stop = startPlayerStatusBridge();
    stop();

    usePlayList.setState({ isPlaying: true });
    expect(updatePlayerStatus).toHaveBeenCalledTimes(1);

    restoreElectron();
  });

  test("迷你窗口不推送（由主窗口统一上报）", () => {
    window.location.hash = "mini-player";

    const stop = startPlayerStatusBridge();

    expect(updatePlayerStatus).not.toHaveBeenCalled();

    stop();
    restoreElectron();
  });

  test("浏览器（无 electron 桥）下安全降级", () => {
    restoreElectron();
    (window as unknown as { electron: unknown }).electron = undefined;

    const stop = startPlayerStatusBridge();
    usePlayList.setState({ isPlaying: true });

    expect(updatePlayerStatus).not.toHaveBeenCalled();
    expect(typeof stop).toBe("function");

    stop();
  });
});
