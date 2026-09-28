/**
 * 第 08 屏「发现音乐 · 列表」的展示内容夹具（应用侧）。
 *
 * 与 `tools/design-fidelity/fixtures/08-discover-list.json` **逐字一致**，由
 * `tests/fixture-screen-08.test.ts` 钉住（与屏 01 / 02 / 06 / 07 的做法相同：
 * JSON 是 verify.py 的取数源，TS 模块是应用的取数源，测试保证两者不漂移）。
 *
 * 走的是**数据**而不是布局：H1 / 导语 / 筛选药丸 / 段标题 / 表头标签 / 五行曲目 /
 * 注解带 / 播放栏正在播放都来自设计稿第 9 页；几何仍在 spec-lock
 * （`screens[07]` 1.3.22 / `geometry.list` / `geometry.listHead`），不在这里。
 * 只有当 URL 携带 `?fixture=08-discover-list` 时，发现音乐页才读取这里的数据 ——
 * 真实数据路径（`getRegionFeedRcmd` 等 service）不经过本文件。
 *
 * **顶栏不在这里**：「音乐分区 | 单一模块」与「已下线: 流行 / 鬼畜」是**路由级
 * chrome**（`topbarSegments.byRoute["/"]` / `globalChrome.topbarNote`），由
 * `src/layout/route-shell.ts` 声明、`TopBar` 渲染。夹具只带页面内容。
 */
import type { FixtureNowPlaying } from "./now-playing";

export const DISCOVER_LIST_FIXTURE_NAME = "08-discover-list";

/** 筛选药丸的变体，与原型 `.pill--{primary,secondary,neutral,accent}` 一致。 */
export type FixturePillVariant = "primary" | "secondary" | "neutral" | "accent";

/**
 * 列表行缩略图的占位档位（`PLACEHOLDER_RADIALS` 的键，按**行位次**命名）。
 *
 * 设计稿第 9 页五行缩略图各自是**纯平色**，代表值分别是 (37,39,49) / (43,41,52) /
 * (47,44,41) / (41,45,43) / (45,41,50)（窗口内不同色数 4–7，偏差 3 以内 =
 * 压缩噪声量级）。写成**等值渐变**的唯一原因是 `Artwork` 走 `background-image`
 * 通道而平色不是合法值（先例：`playbarCover`）。
 *
 * **不是哈希挑选**：五行按位次指名，与屏 07 的三张专辑卡同一处置 —— 比对要求逐字
 * 一致，而且**亮度会进闸门**：五条代表值的亮度 41.7 / 45.3 / 44.0 / 43.0 / 45.3
 * 全低于内容带探针阈值 60（屏 07 的占位就是栽在这一点上，1.3.19 第 ④ 条）。
 *
 * 具体色值在 `placeholder-art.ts`（check-literals 唯一放行的数据豁免文件），
 * 本文件**不复制它** —— 夹具只指名，不带值：字面十六进制色值在任何文件里都算
 * 违规，注释也不例外。
 */
export type FixtureListArtVariant = "listRow1" | "listRow2" | "listRow3" | "listRow4" | "listRow5";

export interface FixturePill {
  label: string;
  variant: FixturePillVariant;
}

export interface FixtureDiscoverTrack {
  /** 行号，设计稿是两位零填充（01…05）。 */
  index: number;
  title: string;
  subtitle: string;
  /** 第三列「播放 · 点赞 · 弹幕」。 */
  stats: string;
  /** 时长列（右对齐）。 */
  duration: string;
  /** 缩略图占位档（`PLACEHOLDER_RADIALS` 的键）。见 `FixtureListArtVariant`。 */
  artVariant: FixtureListArtVariant;
  /**
   * 操作带常驻露出的演示行（设计稿第 04 行）。
   *
   * **不是 `current`**：设计稿第 9 页第 04 行的行底板与相邻行逐点相同（在操作带
   * 之外 x850–1300 的列中位差 = 0.0），只有一条常驻露出的操作带。原型的
   * `.track-row.is-current::before`（7% 白）是原型发挥，会让同行中位从 7 变成 26。
   * 详见 spec-lock `screens[07].rowStateRule` 与 `geometry.list.currentStateNote`。
   */
  demoActions?: boolean;
}

export interface DiscoverListFixture {
  head: { title: string; lead: string };
  filters: FixturePill[];
  section: {
    title: string;
    /** 表头四列标签，顺序即列序：`#` / 标题 / 播放 · 点赞 · 弹幕 / 时长。 */
    head: string[];
  };
  tracks: FixtureDiscoverTrack[];
  note: string;
  /**
   * 播放栏。**本屏与屏 07 不是同一条**（屏 07 是《雨落长街》/ 82 / 228，本屏是
   * 54 / 242），故另立一份。形状见 `./now-playing`；登记见 `NOW_PLAYING_FIXTURES`。
   */
  nowPlaying: FixtureNowPlaying;
}

export const SCREEN_08_DISCOVER_LIST_FIXTURE: DiscoverListFixture = {
  head: {
    title: "发现音乐",
    lead: "来自 B 站音乐分区（1003）的推荐与新歌，收敛为单一模块；列表 / 卡片 / 紧凑 三种展示模式共用同一份数据。",
  },
  /**
   * 5 枚药丸逐字读自设计稿第 9 页，**与屏 07 不是同一组文案**：
   * 第 3 枚「B站音乐分区 · 1003」（第 8 页是「数据源 · 新碟 banner + 分区推荐」）、
   * 第 4 枚「数据源 · 分区推荐 + 新歌」（第 8 页是「去重后合并 27 条」）、
   * 第 5 枚「显示模式 · **列表** ▾」（第 8 页是「卡片」）。这也解释了筛选条容器
   * 宽度的差：本页 x64–771（707），第 8 页 x65–793（728）。
   * 第 5 枚的「▾」是下拉指示符，属标签文案的一部分，不要另画图标。
   */
  filters: [
    { label: "全部播放", variant: "primary" },
    { label: "随机播放", variant: "secondary" },
    { label: "B站音乐分区 · 1003", variant: "neutral" },
    { label: "数据源 · 分区推荐 + 新歌", variant: "neutral" },
    { label: "显示模式 · 列表 ▾", variant: "accent" },
  ],
  section: {
    // 「B 站」之间**有一个空格**（与第 3 枚药丸的「B站音乐分区」不同 —— 那里无空格）。
    title: "B 站音乐分区最新推荐 · 5 条",
    /**
     * 表头四列。第二列「标题」的墨迹落在 x240，即**行内文字列**（x241）而不是列
     * 起点（x120）—— 落地靠 `TrackTableColumn.inset`，值取令牌
     * `--biu-layout-head-title-inset`（= 封面宽 100 + 图文间距 21 = 121）。
     * 同款读数在设计稿另四页（第 03 / 04 / 10 / 13 页）一致为 240 / 240 / 240 / 241，
     * 故不是本屏特例（spec-lock `geometry.listHead`，1.3.22）。
     */
    head: ["#", "标题", "播放 · 点赞 · 弹幕", "时长"],
  },
  /**
   * 五行逐字读自设计稿第 9 页（行顶 374 / 442 / 510 / 578 / 646，行距 68）。
   * 第 04 行是「操作带常驻露出」的演示行 —— 见 `FixtureDiscoverTrack.demoActions`。
   * 第 2 行的标题里，竖线 `|` 前后**各有一个空格**（设计稿原文如此）。
   */
  tracks: [
    {
      index: 1,
      title: "「神呀，接住她的眼泪吧」— 这一首歌完整版来啦",
      subtitle: "音乐综合 · 创作激励计划",
      stats: "32.1 万 · 4.2 万 · 1,286",
      duration: "04:02",
      artVariant: "listRow1",
    },
    {
      index: 2,
      title: "【猎 Hunter】| 「荒野求生的小曲」",
      subtitle: "原创音乐 · 电子",
      stats: "33.4 万 · 5.1 万 · 964",
      duration: "03:18",
      artVariant: "listRow2",
    },
    {
      index: 3,
      title: "我有两颗搞丸！！！",
      subtitle: "翻唱 · 鬼畜素材（已归入音乐分区）",
      stats: "18.7 万 · 2.9 万 · 2,431",
      duration: "02:47",
      artVariant: "listRow3",
    },
    {
      index: 4,
      title: "录歌 和好朋友在学校的最后一个晚上",
      subtitle: "校园音乐 · 翻唱",
      stats: "9.4 万 · 1.6 万 · 512",
      duration: "05:11",
      artVariant: "listRow4",
      demoActions: true,
    },
    {
      index: 5,
      title: "AI 小潮 team 在「反乌托邦」里「拼接遗憾」",
      subtitle: "音乐综合 · AI 翻唱",
      stats: "12.4 万 · 2.0 万 · 738",
      duration: "04:12",
      artVariant: "listRow5",
    },
  ],
  /**
   * 两行注解（设计稿墨迹 728–743 / 748–760，行距 20）—— **与屏 07 的处置相反**：
   * 这一段在 900 视口之内，必须参与像素判定，落地用 `AnnotationBand` 的缺省锚点
   * （`top: 653`，相对内容区），不能用 `anchor="inline"`（会落到 738，低 14px）。
   * 又因 `ScrollContainer` 的根自带 `position: relative`，注解带必须是它的**兄弟**，
   * 由页面渲染。详见 `DiscoverListView` 的说明与 spec-lock `screens[07].verticalRhythmRule`。
   */
  note: "分区收敛：只保留 music（rid=1003）单一模块，原来并列的 流行（getMusicComprehensiveWebRank）与 鬼畜（rid=1007）从信息架构中移除。列表沿用 B 站真实字段（标题 / UP 主 / 播放量 / 时长），不与本地库混排。",
  // 设计稿第 9 页播放栏逐字内容：曲名 / 副行 / 无损 30251 / 00:54 / 04:02 / 队列 · 12。
  // 54 / 242 = 22.3%，与设计稿填充的实际画法（x792–923）自洽；填充宽度本身无闸门。
  nowPlaying: {
    title: "神呀，接住她的眼泪吧",
    sub: "音乐区 UP · 32.1 万播放",
    quality: "lossless",
    elapsedSeconds: 54,
    durationSeconds: 242,
    queueCount: 12,
    playing: false,
  },
};
