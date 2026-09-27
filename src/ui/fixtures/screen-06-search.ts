/**
 * 第 06 屏「搜索结果」的展示内容夹具（应用侧）。
 *
 * 与 `tools/design-fidelity/fixtures/06-search.json` **逐字一致**，由
 * `tests/fixture-screen-06.test.ts` 钉住（与屏 01/02 的做法相同：JSON 是
 * verify.py 的取数源，TS 模块是应用的取数源，测试保证两者不漂移）。
 *
 * 走的是**数据**而不是布局：查询词、结果数、行数据、占位封面序号、注解文案、
 * 播放栏正在播放都来自设计稿第 7 页；几何与取值仍在 spec-lock
 * （`geometry.searchField` / `geometry.creatorRow` / `material.followButton` /
 * `material.rowActionBand`，1.3.12），不在这里。只有当 URL 携带
 * `?fixture=06-search` 时，搜索页才读取这里的数据 —— 真实数据路径
 * （getWebInterfaceWbiSearchType 等 service）不经过本文件。
 */
import type { FixtureNowPlaying } from "./now-playing";

export const SEARCH_FIXTURE_NAME = "06-search";

export interface FixtureSearchVideo {
  title: string;
  subtitle: string;
  /** 时长列（右对齐）。search 变体没有其它右列。 */
  duration: string;
  /** 占位渐变下标（placeholder-art.json 的 gradients）。 */
  artIndex: number;
  /**
   * 操作带常驻露出的演示行（设计稿第 7 页第 01 行）。
   *
   * **不是 `current`**：设计稿第 7 页没有当前行高亮（该行行内背景与行外
   * 无差别）。第 01 行只是「操作带常驻露出」的演示行，与屏 02 的第 04 行
   * 同一性质。详见 spec-lock `geometry.list.currentStateNote`。
   */
  demoActions?: boolean;
}

export interface FixtureSearchCreator {
  name: string;
  /** 副行：「48.2 万粉丝 · 音乐区 UP · 已投稿 128 个视频」。 */
  meta: string;
  /**
   * 第 1 行 true（已关注）、第 2 行 false（关注）—— 两态材质相反：
   * 未关注是反色亮底深字、已关注是白 10% 弱底亮字，见 spec-lock
   * `material.followButton`。
   */
  followed: boolean;
}

export interface SearchFixture {
  /** 查询词。设计稿的查询词「反乌托邦」同时出现在搜索框与 local-link 里。 */
  query: string;
  /**
   * 结果总数 —— 顶栏分段「音乐视频 · 9 / 创作者 · 2」的尾巴是**运行时结果数**
   * （spec-lock `topbarSegments.labelSources`）。真实路径由结果页写入非持久化
   * store；夹具路径由此处给出。注意 9 / 2 是**总数**，列表只展示前三 / 前二行。
   */
  counts: { video: number; creator: number };
  /** local-link 文案。真实路径由查询词组装（`在本地音乐中搜索「${query}」`）。 */
  localLink: string;
  lead: string;
  videoSection: { title: string };
  videos: FixtureSearchVideo[];
  creatorSection: { title: string };
  creators: FixtureSearchCreator[];
  note: string;
  /**
   * 播放栏。设计稿第 7 页的播放栏是满态，内容与页面数据无关（全局组件读
   * `usePlayList`），故按屏落在本夹具里（形状见 `./now-playing`）。
   */
  nowPlaying: FixtureNowPlaying;
}

export const SCREEN_06_SEARCH_FIXTURE: SearchFixture = {
  query: "反乌托邦",
  counts: { video: 9, creator: 2 },
  localLink: "在本地音乐中搜索「反乌托邦」",
  lead: "结果来自 B 站搜索，可按音乐视频或创作者查看。",
  videoSection: {
    title: "音乐视频 · 9 条",
  },
  /**
   * 三行逐字取自设计稿第 7 页。操作带只在第 01 行露出（该行没有当前态
   * 高亮）—— 记 demoActions 而不是 current。无序号列、无表头
   * （tracklist--search 变体），右列只有时长。
   *
   * artIndex 沿用屏 02 的先例：逐字取原型的内联 --tile-art。实测备注：
   * 设计稿第 7 页三行缩略图的**内部是平色**（行 1 平色 38/38/45、
   * 行 2 43/41/50、行 3 37/40/47，对角线逐点相同）——渐变是
   * 原型对占位素材的渲染方式，中心亮度与设计稿平色差 1–7 个灰阶，对 L3
   * 的影响可忽略。行 3 的平色偏冷而渐变 10 偏暖（色相相反）；暂按先例
   * 沿用原型逐字值，若目检有异议再走「先改真值」流程。
   */
  videos: [
    {
      title: "【反乌托邦】AI 小潮 team 在「反乌托邦」里「拼接遗憾」",
      subtitle: "潮汕好男人 · 12.4 万播放",
      duration: "04:12",
      artIndex: 7,
      demoActions: true,
    },
    {
      title: "「反乌托邦」钢琴改编 · 城市夜景版",
      subtitle: "琴键上的猫 · 3.8 万播放",
      duration: "03:26",
      artIndex: 9,
    },
    {
      title: "反乌托邦（2024 Remaster）",
      subtitle: "卧室音乐计划 · 1.2 万播放",
      duration: "05:04",
      artIndex: 10,
    },
  ],
  creatorSection: {
    title: "创作者 · 2 个",
  },
  /**
   * 两行逐字取自设计稿第 7 页。第 1 行「已关注」（弱底亮字）、第 2 行
   * 「关注」（反色亮底深字）—— 两态材质相反，见 `material.followButton`。
   */
  creators: [
    {
      name: "潮汕好男人",
      meta: "48.2 万粉丝 · 音乐区 UP · 已投稿 128 个视频",
      followed: true,
    },
    {
      name: "琴键上的猫",
      meta: "6.7 万粉丝 · 演奏区 UP · 已投稿 64 个视频",
      followed: false,
    },
  ],
  /**
   * 逐字取自设计稿第 7 页注解带。正文里的「歌曲 / 歌单 / 本地文件」出现在
   * 「不再出现」的引用框架里，是设计稿自己的表述 —— copyConstraints 的
   * 红线禁的是把它们当筛选类目提供，不是字面禁令。
   */
  note: "结果类型只有 video 与 bili_user 两类（web-interface-search-type 的 search_type），因此这里不再出现「歌曲 / 歌单 / 本地文件」筛选——本地库改为跨页入口，不假装成统一索引。每条结果都带 Track 的 5 个主操作。",
  // 设计稿第 7 页播放栏逐字内容：曲名 / 副行 / 高清 30280 / 03:02 / 05:04 / 队列 · 12。
  // 182 / 304 = 59.9% —— 与原型的 width: 60% 一致，故两处是同一份数据。
  // 徽标是 AUDIO_QUALITY_LABEL 的第三档 hd（30280 是 audioQualitySort 既有码值），
  // 与第 01/02 屏的无损档不同 —— quality 字段因此由 boolean 改为三档枚举。
  nowPlaying: {
    title: "反乌托邦（2024 Remaster）",
    sub: "卧室音乐计划 · 1.2 万播放",
    quality: "hd",
    elapsedSeconds: 182,
    durationSeconds: 304,
    queueCount: 12,
    playing: false,
  },
};
