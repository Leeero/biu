/**
 * 第 03 屏「稍后播放」的展示内容夹具（应用侧）。
 *
 * 与 `tools/design-fidelity/fixtures/03-watch-later.json` **逐字一致**，由
 * `tests/fixture-screen-03.test.ts` 钉住（与屏 01/02 的做法相同：JSON 是 verify.py
 * 的取数源，TS 模块是应用的取数源，测试保证两者不漂移）。
 *
 * 只有当 URL 携带 `?fixture=03-watch-later` 时才被读取 —— 真实数据路径
 * （getHistoryToViewList / postHistoryToViewDel）不经过本文件。
 * 文案以**设计稿第 4 页**为准，与原型 screens/03-watch-later.html 有四处
 * 逐字差异（第 01 行少「一首」、第 02 行多「｜」、第 03 行「颗」与「@搞丸君」、
 * 第 04 行「@阿岚同学」），差异明细写在该 JSON 的 `doc` 里。
 */
import type { FixtureNowPlaying } from "./now-playing";

export const WATCH_LATER_FIXTURE_NAME = "03-watch-later";

/** 药丸种类。比屏 02 多一档 `danger` —— 设计稿第 4 页的「清除已看完」是红药丸。 */
export type LaterPillKind = "primary" | "secondary" | "neutral" | "accent" | "danger";

export interface LaterPill {
  kind: LaterPillKind;
  label: string;
}

export interface LaterFixtureTrack {
  /** 行号，设计稿全部是两位零填充（01…04）。 */
  index: number;
  title: string;
  subtitle: string;
  /** 第三列「@UP 主 · MM-DD HH:mm」。 */
  cell: string;
  /** 第四列「进度」的逐字内容（62% / 未看 / 04:11）。 */
  progress: string;
  /** 占位渐变下标（placeholder-art.json 的 gradients）。 */
  artIndex: number;
  /** 操作带常驻露出的演示行（设计稿第 04 行）。 */
  demoActions?: boolean;
}

export interface WatchLaterFixture {
  header: {
    title: string;
    lead: string;
  };
  /** 右栏同步状态面板（`.page-head--narrow` 的 320px 列）。 */
  panel: {
    eyebrow: string;
    items: string[];
  };
  filterPills: LaterPill[];
  section: {
    title: string;
    head: string[];
  };
  tracks: LaterFixtureTrack[];
  note: string;
  /** 播放栏。设计稿第 4 页与第 3 页同源（整条栏体同带），逐字内容相同。 */
  nowPlaying: FixtureNowPlaying;
}

export const SCREEN_03_WATCH_LATER_FIXTURE: WatchLaterFixture = {
  header: {
    title: "稍后播放",
    lead: "内容同步自 B 站稍后再看列表，支持标题 / UP 主搜索与日期范围筛选。",
  },
  panel: {
    eyebrow: "与 B 站稍后再看同步",
    items: ["上次同步 · 2 分钟前", "37 条 · 已看 12 条"],
  },
  filterPills: [
    { kind: "primary", label: "播放全部" },
    { kind: "secondary", label: "随机播放" },
    { kind: "danger", label: "清除已看完" },
    { kind: "neutral", label: "同步自 B 站稍后再看" },
    { kind: "accent", label: "日期范围 · 近 30 天" },
  ],
  section: {
    title: "稍后再看 · 共 37 条",
    head: ["#", "标题", "UP 主 · 加入时间", "进度"],
  },
  tracks: [
    {
      index: 1,
      title: "「神呀，接住她的眼泪吧」— 这首歌完整版来啦",
      subtitle: "音乐综合 · 分P 1/1",
      cell: "@音乐区 UP · 09-23 14:22",
      progress: "62%",
      artIndex: 7,
    },
    {
      index: 2,
      title: "【猎 Hunter】｜「荒野求生的小曲」",
      subtitle: "原创音乐 · 分P 1/1",
      cell: "@猎 Hunter · 09-21 09:07",
      progress: "未看",
      artIndex: 9,
    },
    {
      index: 3,
      title: "我有两颗搞丸！！！",
      subtitle: "翻唱 · 分P 1/2",
      cell: "@搞丸君 · 09-18 22:41",
      progress: "未看",
      artIndex: 10,
    },
    {
      index: 4,
      title: "录歌 和好朋友在学校的最后一个晚上",
      subtitle: "校园音乐 · 分P 1/1",
      cell: "@阿岚同学 · 09-12 18:03",
      progress: "04:11",
      artIndex: 3,
      demoActions: true,
    },
  ],
  note: "数据来自 getHistoryToViewList（ps = 20，key + add_time_start / add_time_end 秒级时间戳），与 B 站稍后再看保持一致；页面只提供删除与「清除已看完」，不改写服务端列表语义。",
  nowPlaying: {
    title: "《雨落长街》· 全专上线",
    sub: "卧室音乐计划 · 新碟 banner",
    quality: "lossless",
    elapsedSeconds: 82,
    durationSeconds: 228,
    queueCount: 12,
    playing: false,
  },
};
