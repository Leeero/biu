/**
 * 第 01 屏「我的音乐库」的展示内容夹具（应用侧）。
 *
 * 与 `tools/design-fidelity/fixtures/01-library.json` **逐字一致**，由
 * `tests/fixtures-consistency.test.ts` 钉住（与 placeholder-art 的做法相同：
 * JSON 是 verify.py 的取数源，TS 模块是应用的取数源，测试保证两者不漂移）。
 *
 * 走的是**数据**而不是布局：标题、条数、元信息、占位封面序号都来自设计稿
 * 第 2 页；几何与取值仍在 spec-lock，不在这里。只有当 URL 携带
 * `?fixture=01-library` 时，库页才读取这里的数据 —— 真实数据路径
 * （useFavoritesStore / useSettings / 下载 IPC）不经过本文件。
 */
import type { IconName } from "@/ui/primitives/icon";

import type { FixtureNowPlaying } from "./now-playing";

export const LIBRARY_FIXTURE_NAME = "01-library";

/** 收藏夹 11 / 合集 21 / 系列 31（与 CollectionType 一致）；"dir" 是本地目录。 */
export type FixtureTileType = 11 | 21 | 31 | "dir";

export interface FixtureLibraryTile {
  id: number;
  type: FixtureTileType;
  title: string;
  trackCount: number;
  /** 元信息的后半段：「42 首 · **3 小时 12 分**」中的后半。 */
  metaNote: string;
  /** 占位渐变下标（placeholder-art.json 的 gradients）。 */
  artIndex: number;
  /** 该瓦片常驻演示操作带（设计稿第 3 枚瓦片）。 */
  demoActions?: boolean;
}

export interface FixtureLibraryOverview {
  localDirs: number;
  localFiles: number;
  tracks: number;
  qualityLabel: string;
  downloadsDone: number;
  downloadsActive: number;
}

export interface LibraryFixture {
  user: { mid: number; isLogin: true };
  library: {
    created: FixtureLibraryTile[];
    collected: FixtureLibraryTile[];
    overview: FixtureLibraryOverview;
  };
  /**
   * 播放栏。设计稿第 2 页的播放栏在**每一页**都是满态，与页面数据无关，
   * 故按屏落在本夹具里（形状见 `./now-playing`）。
   */
  nowPlaying: FixtureNowPlaying;
}

export const SCREEN_01_LIBRARY_FIXTURE: LibraryFixture = {
  user: { mid: 10000, isLogin: true },
  library: {
    created: [
      { id: 901, type: 11, title: "夜航电子", trackCount: 42, metaNote: "3 小时 12 分", artIndex: 1 },
      { id: 902, type: 21, title: "器乐练习", trackCount: 28, metaNote: "2 小时 04 分", artIndex: 6 },
      {
        id: 903,
        type: 31,
        title: "Live 现场",
        trackCount: 19,
        metaNote: "1 小时 38 分",
        artIndex: 2,
        demoActions: true,
      },
      { id: 0, type: "dir", title: "本地无损库", trackCount: 56, metaNote: "4 小时 05 分 · FLAC", artIndex: 8 },
    ],
    collected: [
      { id: 951, type: 11, title: "深夜循环", trackCount: 63, metaNote: "无损", artIndex: 1 },
      { id: 952, type: 21, title: "睡前歌单", trackCount: 31, metaNote: "无损", artIndex: 6 },
    ],
    overview: {
      localDirs: 3,
      localFiles: 1284,
      tracks: 214,
      qualityLabel: "无损优先",
      downloadsDone: 18,
      downloadsActive: 2,
    },
  },
  // 设计稿第 2 页播放栏逐字内容：夜航 / NOISE_LAB / 无损 30251 / 00:52 / 04:10 / 队列 · 12。
  // 52 / 250 = 20.8% —— 与设计稿进度条的填充比例一致，故两处是同一份数据。
  nowPlaying: {
    title: "夜航",
    sub: "NOISE_LAB",
    lossless: true,
    elapsedSeconds: 52,
    durationSeconds: 250,
    queueCount: 12,
    playing: false,
  },
};

/** 库瓦片的五个主操作（设计稿注解原文：播放 / 下一首 / 入队 / 收藏 / 下载音频）。 */
export interface LibraryTileAction {
  key: string;
  label: string;
  icon: IconName;
}

export const LIBRARY_TILE_ACTIONS: readonly LibraryTileAction[] = [
  { key: "play", label: "播放", icon: "play" },
  { key: "play-next", label: "下一首", icon: "next" },
  { key: "queue-add", label: "入队", icon: "queue-add" },
  { key: "favorite", label: "收藏", icon: "heart" },
  { key: "download-audio", label: "下载音频", icon: "download" },
] as const;
