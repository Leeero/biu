import { beforeEach, describe, expect, test, vi } from "vitest";

const { addToast } = vi.hoisted(() => ({ addToast: vi.fn() }));

vi.mock("@heroui/react", async () => {
  const actual: any = await vi.importActual("@heroui/react");
  return { ...actual, addToast };
});

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

// 避免真实上报请求
vi.mock("@/common/utils/play-report", () => ({
  beginPlayReport: vi.fn(async () => undefined),
  endPlayReport: vi.fn(),
  reportHeartbeat: vi.fn(async () => undefined),
}));

// 迷你模式切换涉及主进程窗口操作，测试里只关心「命令被路由到这里」
vi.mock("@/common/utils/mini-player", () => ({
  toggleMiniMode: vi.fn(async () => undefined),
  createBroadcastChannel: vi.fn(),
}));

import { toggleMiniMode } from "@/common/utils/mini-player";
import { isPlayerCommand, openFavoriteForCurrentTrack, runPlayerCommand } from "@/common/utils/player-command";
import { useLoginModal } from "@/store/login-modal";
import { useModalStore } from "@/store/modal";
import { useMusicFavStore } from "@/store/music-fav";
import { usePlayList } from "@/store/play-list";
import { useUser } from "@/store/user";

const localItem = (id: string) => ({
  id,
  type: "audio" as const,
  source: "local" as const,
  title: `本地-${id}`,
  audioUrl: `file:///music/${id}.mp3`,
});

const mvItem = {
  id: "mv-1",
  type: "mv" as const,
  title: "视频稿件",
  aid: "100",
  bvid: "BV1",
  cid: "11",
  audioUrl: "https://video.test/a.mp3",
  ownerName: "up",
};

const audioItem = {
  id: "au-1",
  type: "audio" as const,
  title: "音频稿件",
  sid: 20,
  audioUrl: "https://audio.test/a.mp3",
  ownerName: "author",
};

beforeEach(() => {
  vi.clearAllMocks();
  window.location.hash = "";
  // user/play-list 等 store 走 zustand persist，会调 window.electron 读写；
  // 测试环境没有 preload，给一个最小桩避免未处理的 rejection
  (window as unknown as { electron: unknown }).electron = {
    getStore: async () => undefined,
    setStore: async () => undefined,
    clearStore: async () => undefined,
    toggleMiniPlayer: async () => undefined,
  };
  usePlayList.setState({
    isPlaying: false,
    isMuted: false,
    volume: 0.5,
    list: [],
    playId: undefined,
    nextId: undefined,
  });
  useModalStore.getState().onCloseFavSelectModal();
  useLoginModal.getState().setOpen(false);
  useUser.setState({ user: null });
  useMusicFavStore.setState({ isFav: false, isThumb: false });
});

describe("播放命令白名单", () => {
  test("只放行播放器动作，非播放器快捷键（toggleLyrics）被拒绝", () => {
    expect(isPlayerCommand("togglePlay")).toBe(true);
    expect(isPlayerCommand("favorite")).toBe(true);
    expect(isPlayerCommand("toggleMute")).toBe(true);
    expect(isPlayerCommand("toggleLyrics")).toBe(false);
    expect(isPlayerCommand("not-a-command")).toBe(false);
  });
});

describe("播放控制命令", () => {
  test("音量加减按 5% 步进，并夹在 0-1 之间", () => {
    runPlayerCommand("volumeUp");
    expect(usePlayList.getState().volume).toBe(0.55);

    runPlayerCommand("volumeDown");
    runPlayerCommand("volumeDown");
    expect(usePlayList.getState().volume).toBe(0.45);

    usePlayList.setState({ volume: 0.98 });
    runPlayerCommand("volumeUp");
    expect(usePlayList.getState().volume).toBe(1);

    usePlayList.setState({ volume: 0.03 });
    runPlayerCommand("volumeDown");
    expect(usePlayList.getState().volume).toBe(0);
  });

  test("静音命令同时改动 store 与 audio 元素", async () => {
    await usePlayList.getState().init();

    runPlayerCommand("toggleMute");
    expect(usePlayList.getState().isMuted).toBe(true);
    expect(usePlayList.getState().getAudio().muted).toBe(true);

    runPlayerCommand("toggleMute");
    expect(usePlayList.getState().isMuted).toBe(false);
    expect(usePlayList.getState().getAudio().muted).toBe(false);
  });

  test("上一曲/下一曲在队列内移动播放位置", () => {
    usePlayList.setState({ list: [localItem("a"), localItem("b")], playId: "a" });

    runPlayerCommand("next");
    expect(usePlayList.getState().playId).toBe("b");

    runPlayerCommand("prev");
    expect(usePlayList.getState().playId).toBe("a");
  });

  test("迷你模式命令路由到迷你播放器切换", () => {
    runPlayerCommand("toggleMiniMode");
    expect(toggleMiniMode).toHaveBeenCalledTimes(1);
  });

  test("迷你窗口上下文里命令一律不执行（避免双声道与自我切换）", () => {
    window.location.hash = "mini-player";

    runPlayerCommand("volumeUp");
    runPlayerCommand("toggleMiniMode");
    runPlayerCommand("favorite");

    expect(usePlayList.getState().volume).toBe(0.5);
    expect(toggleMiniMode).not.toHaveBeenCalled();
    expect(useModalStore.getState().isFavSelectModalOpen).toBe(false);
  });
});

describe("收藏当前歌曲", () => {
  test("没有正在播放的曲目：只提示，不开弹窗", () => {
    openFavoriteForCurrentTrack();

    expect(useModalStore.getState().isFavSelectModalOpen).toBe(false);
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ color: "warning" }));
  });

  test("本地音乐：提示不支持收藏", () => {
    usePlayList.setState({ list: [localItem("a")], playId: "a" });

    openFavoriteForCurrentTrack();

    expect(useModalStore.getState().isFavSelectModalOpen).toBe(false);
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ title: "本地音乐暂不支持收藏" }));
  });

  test("未登录：打开登录弹窗并提示", () => {
    usePlayList.setState({ list: [audioItem], playId: "au-1" });

    runPlayerCommand("favorite");

    expect(useLoginModal.getState().open).toBe(true);
    expect(useModalStore.getState().isFavSelectModalOpen).toBe(false);
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ title: "登录后即可收藏" }));
  });

  test("已登录 + 视频稿件：rid 用 aid、type 为 2", () => {
    useUser.setState({ user: { isLogin: true } as any });
    usePlayList.setState({ list: [mvItem], playId: "mv-1" });

    runPlayerCommand("favorite");

    const modal = useModalStore.getState();
    expect(modal.isFavSelectModalOpen).toBe(true);
    expect(modal.favSelectModalData?.rid).toBe("100");
    expect(modal.favSelectModalData?.type).toBe(2);
  });

  test("已登录 + 音频稿件：rid 用 sid、type 为 12", () => {
    useUser.setState({ user: { isLogin: true } as any });
    usePlayList.setState({ list: [audioItem], playId: "au-1" });

    runPlayerCommand("favorite");

    const modal = useModalStore.getState();
    expect(modal.isFavSelectModalOpen).toBe(true);
    expect(modal.favSelectModalData?.rid).toBe("20");
    expect(modal.favSelectModalData?.type).toBe(12);
  });

  test("收藏成功后回写收藏态", () => {
    useUser.setState({ user: { isLogin: true } as any });
    usePlayList.setState({ list: [audioItem], playId: "au-1" });

    runPlayerCommand("favorite");
    useModalStore.getState().favSelectModalData?.onSuccess?.([1, 2]);

    expect(useMusicFavStore.getState().isFav).toBe(true);
  });
});
