import { describe, expect, test, beforeEach, vi } from "vitest";

import { PlayMode } from "@/common/constants/audio";
import { isSame, usePlayList } from "@/store/play-list";
import { usePlayProgress } from "@/store/play-progress";

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

vi.mock("@/service/audio-song-info", () => ({
  getAudioSongInfo: vi.fn(async ({ sid }) => ({
    data: {
      id: sid,
      uid: 1,
      uname: "owner",
      author: "owner",
      title: "audio-title",
      cover: "https://cover.test/c.png",
      intro: "",
      crtype: 1,
      duration: 123,
      passtime: Date.now(),
      curtime: Date.now(),
      aid: 0,
    },
  })),
}));

vi.mock("@/service/web-interface-view", () => ({
  getWebInterfaceView: vi.fn(async () => ({
    data: {
      aid: 100,
      title: "mv-title",
      pic: "https://cover.test/m.png",
      owner: { name: "owner", mid: 1 },
      pages: [
        { cid: 11, page: 1, part: "p1", duration: 60, first_frame: "https://ff.test/1.png" },
        { cid: 12, page: 2, part: "p2", duration: 60, first_frame: "https://ff.test/2.png" },
      ],
    },
  })),
}));

vi.mock("@heroui/react", async () => {
  const actual: any = await vi.importActual("@heroui/react");
  return { ...actual, addToast: vi.fn() };
});

beforeEach(() => {
  vi.clearAllMocks();
  usePlayList.getState().clear();
  usePlayList.setState({
    isPlaying: false,
    isMuted: false,
    volume: 0.5,
    playMode: PlayMode.Loop,
    rate: 1,
    duration: undefined,
    nextId: undefined,
    shouldKeepPagesOrderInRandomPlayMode: true,
  });
  usePlayProgress.setState({ currentTime: 0 });
});

describe("play-list store", () => {
  test("initial state", () => {
    const s = usePlayList.getState();
    expect(s.isPlaying).toBe(false);
    expect(s.isMuted).toBe(false);
    expect(s.volume).toBe(0.5);
    expect(s.playMode).toBe(PlayMode.Loop);
    expect(s.rate).toBe(1);
    expect(s.list.length).toBe(0);
  });

  test("init sets audio props and handlers", async () => {
    const s = usePlayList.getState();
    await s.init();
    const audio = s.getAudio();
    expect(audio.volume).toBe(0.5);
    expect(audio.muted).toBe(false);
    expect(audio.playbackRate).toBe(1);
    expect(typeof audio.onplay).toBe("function");
  });

  test("setVolume, setRate, setPlayMode", async () => {
    const s = usePlayList.getState();
    await s.init();
    s.setVolume(0.8);
    s.setRate(1.25);
    s.togglePlayMode();
    s.togglePlayMode();
    const audio = s.getAudio();
    expect(usePlayList.getState().volume).toBe(0.8);
    expect(audio.volume).toBe(0.8);
    expect(usePlayList.getState().rate).toBe(1.25);
    expect(audio.playbackRate).toBe(1.25);
    expect(usePlayList.getState().playMode).toBe(PlayMode.Single);
    expect(audio.loop).toBe(true);
  });

  test("identifies local and online items with stable identities", () => {
    expect(
      isSame({ type: "audio", source: "local", id: "file-a" }, { type: "mv", source: "local", id: "file-a" }),
    ).toBe(true);
    expect(isSame({ type: "mv", bvid: "BV1" }, { type: "mv", bvid: "BV1" })).toBe(true);
    expect(isSame({ type: "audio", sid: 10 }, { type: "audio", sid: 10 })).toBe(true);
    expect(isSame({ type: "mv", bvid: "10" }, { type: "audio", sid: 10 })).toBe(false);
    expect(isSame(undefined, { type: "audio", sid: 10 })).toBe(false);
  });

  test("mute and seek keep store and audio in sync", async () => {
    const s = usePlayList.getState();
    await s.init();
    s.toggleMute();
    s.seek(42.25);
    expect(usePlayList.getState().isMuted).toBe(true);
    expect(s.getAudio().muted).toBe(true);
    expect(s.getAudio().currentTime).toBe(42.25);
    expect(usePlayProgress.getState().currentTime).toBe(42.25);
  });

  test("cycles through every play mode and updates single-track loop", async () => {
    const s = usePlayList.getState();
    await s.init();
    const expected = [PlayMode.Random, PlayMode.Single, PlayMode.Sequence, PlayMode.Loop];
    for (const mode of expected) {
      s.togglePlayMode();
      expect(usePlayList.getState().playMode).toBe(mode);
      expect(s.getAudio().loop).toBe(mode === PlayMode.Single);
    }
  });

  test("play audio adds item and toggles playing", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.play({ type: "audio", sid: 101, title: "a", cover: "", ownerName: "", ownerMid: 0 });
    expect(usePlayList.getState().list.length).toBe(1);
    const id = usePlayList.getState().playId as string;
    expect(typeof id).toBe("string");
    const audio = s.getAudio();
    expect(audio.src).toContain("audio.test");
    expect(navigator.mediaSession.playbackState).toBe("playing");
  });

  test("playList sets list and next/prev in sequence", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.playList([
      { type: "audio", sid: 1, title: "a1" },
      { type: "audio", sid: 2, title: "a2" },
    ]);
    const firstId = usePlayList.getState().playId as string;
    await s.next();
    const secondId = usePlayList.getState().playId as string;
    expect(secondId).not.toBe(firstId);
    await s.prev();
    expect(usePlayList.getState().playId).toBe(firstId);
  });

  test("random mode keeps pages order", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.playList([{ type: "mv", bvid: "BVx", title: "m1" }]);
    const mv = usePlayList.getState().list[0];
    const { getWebInterfaceView } = await import("@/service/web-interface-view");
    const pages = await getWebInterfaceView({ bvid: mv.bvid as string });
    usePlayList.setState(() => ({
      list: pages.data.pages.map(p => ({
        id: `${p.page}-id`,
        type: "mv",
        bvid: mv.bvid,
        aid: "100",
        cid: String(p.cid),
        title: "mv-title",
        cover: "",
        ownerName: "owner",
        ownerMid: 1,
        hasMultiPart: true,
        pageIndex: p.page,
        pageTitle: p.part,
        pageCover: p.first_frame,
        totalPage: pages.data.pages.length,
        duration: p.duration,
      })),
      playId: "1-id",
    }));
    s.togglePlayMode();
    s.setShouldKeepPagesOrderInRandomPlayMode(true);
    await s.next();
    expect(usePlayList.getState().playId).toBe("2-id");
  });

  test("addToNext inserts after current", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.playList([{ type: "audio", sid: 10, title: "a10" }]);
    const currentId = usePlayList.getState().playId as string;
    await s.addToNext({ type: "audio", sid: 20, title: "a20" });
    const idx = usePlayList.getState().list.findIndex(i => i.id === currentId);
    const nextItem = usePlayList.getState().list[idx + 1];
    expect(usePlayList.getState().nextId).toBe(nextItem.id);
    expect(nextItem.sid).toBe(20);
  });

  test("nextId is consumed once before normal queue order resumes", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.playList([
      { type: "audio", sid: 1, title: "a1" },
      { type: "audio", sid: 2, title: "a2" },
      { type: "audio", sid: 3, title: "a3" },
    ]);
    const thirdId = usePlayList.getState().list[2].id;
    usePlayList.setState({ nextId: thirdId });
    await s.next();
    expect(usePlayList.getState().playId).toBe(thirdId);
    expect(usePlayList.getState().nextId).toBeUndefined();
    await s.next();
    expect(usePlayList.getState().playId).toBe(usePlayList.getState().list[0].id);
  });

  test("sequence mode stops at the end instead of wrapping", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.playList([
      { type: "audio", sid: 1, title: "a1" },
      { type: "audio", sid: 2, title: "a2" },
    ]);
    usePlayList.setState({
      playMode: PlayMode.Sequence,
      playId: usePlayList.getState().list[1].id,
    });
    const audio = s.getAudio();
    audio.currentTime = 100;
    await audio.play();
    audio.onended?.(new Event("ended"));
    expect(audio.currentTime).toBe(0);
    expect(audio.paused).toBe(true);
    expect(usePlayList.getState().playId).toBe(usePlayList.getState().list[1].id);
  });

  test("keeps local id and url without requesting online metadata", async () => {
    const s = usePlayList.getState();
    const { getAudioSongInfo } = await import("@/service/audio-song-info");
    await s.play({
      type: "audio",
      id: "local-file-1",
      source: "local",
      audioUrl: "file:///music/a.mp3",
      title: "<b>Local A</b>",
    });
    const item = usePlayList.getState().list[0];
    expect(item).toMatchObject({
      id: "local-file-1",
      source: "local",
      audioUrl: "file:///music/a.mp3",
      title: "Local A",
    });
    expect(getAudioSongInfo).not.toHaveBeenCalled();
  });

  test("addList deduplicates and preserves playing item", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.playList([{ type: "audio", sid: 1, title: "a1" }]);
    await s.addList([
      { type: "audio", sid: 1, title: "a1" },
      { type: "audio", sid: 3, title: "a3" },
    ]);
    expect(usePlayList.getState().list.some(i => i.sid === 1)).toBe(true);
    expect(usePlayList.getState().list.some(i => i.sid === 3)).toBe(true);
    const newId = usePlayList.getState().playId as string;
    const newItem = usePlayList.getState().list.find(i => i.id === newId);
    expect(newItem?.sid).toBe(1);
  });

  test("del removes by id and clear works", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.playList([
      { type: "audio", sid: 1, title: "a1" },
      { type: "audio", sid: 2, title: "a2" },
    ]);
    const otherId = usePlayList.getState().list.find(i => i.sid === 2)?.id as string;
    await s.del(otherId);
    expect(usePlayList.getState().list.some(i => i.id === otherId)).toBe(false);
    s.clear();
    expect(usePlayList.getState().list.length).toBe(0);
    expect(usePlayList.getState().playId).toBeUndefined();
  });

  test("reorder moves an existing queue item without changing playback identity", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.playList([
      { type: "audio", sid: 1, title: "a1" },
      { type: "audio", sid: 2, title: "a2" },
      { type: "audio", sid: 3, title: "a3" },
    ]);
    const playId = usePlayList.getState().playId;
    s.reorder(2, 0);
    expect(usePlayList.getState().list.map(item => item.sid)).toEqual([3, 1, 2]);
    expect(usePlayList.getState().playId).toBe(playId);
  });

  test("play handles data fetch failure gracefully", async () => {
    const s = usePlayList.getState();
    await s.init();
    // Mock getWebInterfaceView to return empty/error structure
    const { getWebInterfaceView } = await import("@/service/web-interface-view");
    vi.mocked(getWebInterfaceView).mockResolvedValueOnce({ code: -1 } as any);

    // This should not crash
    await s.play({ type: "mv", bvid: "BV_fail", title: "fail" });
    expect(usePlayList.getState().list.length).toBe(0);
  });

  test("addToNext handles data fetch failure gracefully", async () => {
    const s = usePlayList.getState();
    await s.init();
    await s.playList([{ type: "audio", sid: 1, title: "a1" }]);

    const { getWebInterfaceView } = await import("@/service/web-interface-view");
    vi.mocked(getWebInterfaceView).mockResolvedValueOnce({ code: -1 } as any);

    await s.addToNext({ type: "mv", bvid: "BV_fail", title: "fail" });
    expect(usePlayList.getState().list.length).toBe(1);
  });
});
