/**
 * 第 02 屏「我的收藏 · 详情」的展示内容夹具（应用侧）。
 *
 * 与 `tools/design-fidelity/fixtures/02-playlist-detail.json` **逐字一致**，由
 * `tests/fixture-screen-02.test.ts` 钉住（与屏 01 的做法相同：JSON 是 verify.py
 * 的取数源，TS 模块是应用的取数源，测试保证两者不漂移）。
 *
 * 走的是**数据**而不是布局：标题、导语、药丸、行数据、占位封面序号、弹层文案
 * 都来自设计稿第 3 页；几何与取值仍在 spec-lock，不在这里。只有当 URL 携带
 * `?fixture=02-playlist-detail` 时，详情页才读取这里的数据 —— 真实数据路径
 * （getFavFolderInfo / getFavResourceList 等 service）不经过本文件。
 */
import type { FixtureNowPlaying } from "./now-playing";

export const PLAYLIST_DETAIL_FIXTURE_NAME = "02-playlist-detail";

/** 药丸种类，与原型 `.pill--primary / -secondary / -neutral / -accent` 对应。 */
export type FixturePillKind = "primary" | "secondary" | "neutral" | "accent";

export interface FixturePill {
  kind: FixturePillKind;
  label: string;
}

export interface FixtureTrack {
  /** 行号，设计稿全部是两位零填充（01…04）。 */
  index: number;
  title: string;
  subtitle: string;
  /** 第三列「收藏于 · 分P」。 */
  cell: string;
  /** 时长列（右对齐）。 */
  duration: string;
  /** 占位渐变下标（placeholder-art.json 的 gradients）。 */
  artIndex: number;
  /**
   * 操作带常驻露出的演示行（设计稿第 04 行）。
   *
   * **不是 `current`**：设计稿第 3 页没有当前行高亮（第 04 行的行内背景实测 8.23，
   * 与行外底板 8.00 只差 0.23）。第 04 行只是「操作带常驻露出」的演示行，
   * 原型的 `.track-row.is-current` 是原型的发挥。详见 spec-lock
   * `geometry.list.currentStateNote`。
   */
  demoActions?: boolean;
}

export interface FixtureModal {
  title: string;
  sub: string;
  quality: string;
  range: string;
  action: string;
}

export interface PlaylistDetailFixture {
  collectionType: 11;
  header: {
    title: string;
    lead: string;
  };
  filterPills: FixturePill[];
  section: {
    title: string;
    head: string[];
  };
  tracks: FixtureTrack[];
  modal: FixtureModal;
  note: string;
  /**
   * 播放栏。设计稿第 3 页的播放栏是满态，内容与页面数据无关（全局组件读
   * `usePlayList`），故按屏落在本夹具里（形状见 `./now-playing`）。
   */
  nowPlaying: FixtureNowPlaying;
}

export const SCREEN_02_PLAYLIST_DETAIL_FIXTURE: PlaylistDetailFixture = {
  collectionType: 11,
  header: {
    title: "我的收藏 · 播放列表详情",
    lead: "收藏夹 / 合集 / 系列 共用一套详情模板，仅数据类型不同。",
  },
  filterPills: [
    { kind: "primary", label: "全部播放" },
    { kind: "secondary", label: "随机播放" },
    { kind: "neutral", label: "收藏 · 取消收藏" },
    { kind: "accent", label: "批量下载音频 · 已选 12" },
    { kind: "neutral", label: "更多 ▾ · 编辑 / 清理失效 / 删除" },
  ],
  section: {
    title: "默认收藏夹 · 214 个内容",
    head: ["#", "内容", "收藏于 · 分P", "时长"],
  },
  /**
   * 右列（收藏于 · 分P / 时长）逐行取自设计稿第 3 页的**可见**行。
   *
   * 设计稿第 1 行的右列被下载弹层完全遮挡（弹层 y296–449 盖住该行墨迹带
   * 402–414），对它不构成约束 —— 第 1 行保留原型的字面值。注意设计稿的右列
   * 与原型**逐行错位一格**：设计稿第 2/3/4 行是 09-21 / 09-18 / 09-12，
   * 而原型把 09-21 给了第 1 行。真值优先按设计稿。
   *
   * 第 1 行因此在字面上与第 2 行重复（同为 09-21 / 03:18）。这在夹具模式下
   * **不可见**：应用侧弹层画在同一位置，同样遮住第 1 行的右列。
   */
  tracks: [
    {
      index: 1,
      title: "「神呀，接住她的眼泪吧」— 这一首歌完整版来啦",
      subtitle: "音乐综合 · 来自默认收藏夹",
      cell: "收藏于 09-21 · 分P 1/1",
      duration: "03:18",
      artIndex: 7,
    },
    {
      index: 2,
      title: "【猎 Hunter】「荒野求生的小曲」",
      subtitle: "原创音乐 · 来自默认收藏夹",
      cell: "收藏于 09-21 · 分P 1/1",
      duration: "03:18",
      artIndex: 9,
    },
    {
      index: 3,
      title: "我有两颢搞丸！！！",
      subtitle: "翻唱 · 来自默认收藏夹",
      cell: "收藏于 09-18 · 分P 1/2",
      duration: "02:47",
      artIndex: 10,
    },
    {
      index: 4,
      title: "录歌 和好朋友在学校的最后一个晚上",
      subtitle: "校园音乐 · 来自默认收藏夹",
      cell: "收藏于 09-12 · 分P 1/1",
      duration: "05:11",
      artIndex: 3,
      demoActions: true,
    },
  ],
  modal: {
    title: "批量下载音频",
    sub: "先选音质与范围，再统一入队（download-select-modal）",
    quality: "音质：自动 30232 · 高清 30280 · 无损 30251 · 杜比 30250",
    range: "范围：全部 214 首 · 仅已选 12 首 · 跳过已下载",
    action: "加入下载队列",
  },
  note: "三种集合类型（CollectionType 11 / 21 / 31）在代码里是三条数据通路，PRD 7.2 要求统一为同一个「播放列表详情」模板：播放全部、收藏、批量下载音频、编辑 / 清理失效 / 删除都挂在这一层。",
  // 设计稿第 3 页播放栏逐字内容：片名 / 副行 / 无损 30251 / 01:22 / 03:48 / 队列 · 12。
  // 82 / 228 = 36.0% —— 与设计稿进度条填充比例一致，故两处是同一份数据。
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
