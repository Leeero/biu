/**
 * 第 07 屏「发现音乐 · 卡片」的展示内容夹具（应用侧）。
 *
 * 与 `tools/design-fidelity/fixtures/07-discover-card.json` **逐字一致**，由
 * `tests/fixture-screen-07.test.ts` 钉住（与屏 01/02/06 的做法相同：JSON 是
 * verify.py 的取数源，TS 模块是应用的取数源，测试保证两者不漂移）。
 *
 * 走的是**数据**而不是布局：H1 / 导语 / 筛选药丸 / 大卡 / 专辑卡 / 注解带 /
 * 播放栏正在播放都来自设计稿第 8 页；几何与材质仍在 spec-lock
 * （`geometry.heroCard` / `geometry.albumCard` / `geometry.albumGrid` /
 * `material.tag`，1.3.16 起、1.3.17 精修），不在这里。只有当 URL 携带
 * `?fixture=07-discover-card` 时，发现音乐页才读取这里的数据 —— 真实数据路径
 * （new/music 与分区推荐的 service）不经过本文件。
 *
 * **顶栏不在这里**：「已下线: 流行 / 鬼畜」与「音乐分区 | 单一模块」是**路由级
 * chrome**（`globalChrome.topbarNote` / `topbarSegments.byRoute["/"]`），由
 * `src/layout/route-shell.ts` 声明、`TopBar` 渲染。夹具只带页面内容。
 */
import type { FixtureNowPlaying } from "./now-playing";

export const DISCOVER_CARD_FIXTURE_NAME = "07-discover-card";

/** 筛选药丸的变体，与原型 `.pill--{primary,secondary,neutral,accent}` 一致。 */
export type FixturePillVariant = "primary" | "secondary" | "neutral" | "accent";

/**
 * 标签芯片的变体。
 *
 * 由设计稿**实测底色**反解，不是照原型抄类名：偏蓝底（大卡 `(24,42,61)`、
 * 专辑卡 `(22,41,63)`）是强调/音质档，中性灰（`(42,42,44)`）是 plain 档。
 * 大卡的「无损 30251」用 `quality`（音质蓝），专辑卡的「畅销 1.2 万」用
 * `accent`（强调蓝）—— 两者在稿面上同色，档位名沿用既有 `TagVariant`。
 */
export type FixtureTagVariant = "quality" | "plain" | "accent";

/**
 * 大卡封面的占位档位（`PLACEHOLDER_RADIALS` 的键）。
 *
 * 本屏是**卡片分支**，用 `heroCard` —— 设计稿大卡封面实测是**纯平色**
 * （窗口 x150–400 / y430–520，「不同色数 = 1」逐点相同）。`heroCard` 那一档因此
 * 也写成了等值渐变（1.3.19 订正：1.3.16 只保证「起点逐通道相同」，封面其余部分
 * 会一路暗下去，整片比稿面暗一档）。`heroList` 是列表分支（屏 08）的
 * 固定渐变，不要混用。
 *
 * 具体色值在 `placeholder-art.ts`（check-literals 唯一放行的数据豁免文件），
 * 本文件**不复制它** —— 夹具只指名，不带值（注释里也不写：字面十六进制色值
 * 在任何文件里都算违规，注释不例外）。
 */
export type FixtureHeroArtVariant = "heroCard" | "heroList";

/**
 * 专辑卡封面的占位档位（`PLACEHOLDER_RADIALS` 的键，按**卡位次**命名）。
 *
 * 三张卡是**三条不同的纯平色**，不是从 `gradients` 里哈希挑选（同 `heroCard` 的
 * 处置）。1.3.16 曾按原型取 `gradients[5 / 11 / 12]`，那三条 150° 渐变的起点亮度
 * 69.7 **高于内容带探针阈值 60**，渲染侧封面顶部整片被判成墨迹，把封面左侧徽标的
 * 墨迹并进同一条带 —— 屏 07 内容带覆盖率卡在 60% 的直接原因（spec-lock 1.3.19 第 ④ 条）。
 */
export type FixtureAlbumArtVariant = "albumCard1" | "albumCard2" | "albumCard3";

export interface FixturePill {
  label: string;
  variant: FixturePillVariant;
}

export interface FixtureTag {
  label: string;
  variant: FixtureTagVariant;
}

export interface FixtureHeroCard {
  /** 封面左上角徽标（`.hero-art .badge`：left 12 / top 12）。 */
  badge: string;
  /**
   * 封面左下角画幅说明（`.hero-art .ratio-note`）。
   *
   * 大卡**有**（设计稿墨迹 x93–254 × y528–539 ⇒ 左 14 / 下 12），与专辑卡相反。
   */
  ratioNote: string;
  /** 标题上方的强调芯片（独家首发）。 */
  tag: string;
  title: string;
  meta: string;
  tags: FixtureTag[];
  artVariant: FixtureHeroArtVariant;
}

export interface FixtureAlbumCard {
  badge: string;
  title: string;
  meta: string;
  tags: FixtureTag[];
  /** 封面占位档（`PLACEHOLDER_RADIALS` 的键）。见 `FixtureAlbumArtVariant`。 */
  artVariant: FixtureAlbumArtVariant;
  /**
   * **这里没有 `ratioNote` 字段，是刻意的**。
   *
   * 设计稿第 8 页三张专辑封面左下角逐点为空（三张卡该区域 `> 底 + 8` 的像素数
   * 均为 0），原型的 `<span class="ratio-note">1:1</span>` 是原型发挥（spec-lock
   * 1.3.16 第 4 条，与 1.3.2 的「原型发挥」同族）。缺字段本身就是真值，由
   * `tests/fixture-screen-07.test.ts` 断言其缺席 —— 谁照原型补回来，测试会拦。
   */
}

export interface DiscoverCardFixture {
  head: { title: string; lead: string };
  filters: FixturePill[];
  heroSection: { title: string };
  hero: FixtureHeroCard;
  albumSection: { title: string };
  albums: FixtureAlbumCard[];
  note: string;
  /**
   * 播放栏。设计稿第 8 页的播放栏是满态，内容与页面数据无关（全局组件读
   * `usePlayList`），故按屏落在本夹具里（形状见 `./now-playing`）。
   */
  nowPlaying: FixtureNowPlaying;
}

export const SCREEN_07_DISCOVER_CARD_FIXTURE: DiscoverCardFixture = {
  head: {
    title: "发现音乐",
    lead: "新碟 banner 与分区推荐合并去重后呈现，支持 卡片 / 列表 / 紧凑 三种展示模式。",
  },
  /**
   * 5 枚药丸逐字取自原型，宽度与设计稿逐枚对得上（101 / 101 / 227 / 135 / 145）。
   * 第 5 枚的「卡片」是当前展示模式（本屏即卡片分支），「▾」是标签文案的一部分。
   */
  filters: [
    { label: "全部播放", variant: "primary" },
    { label: "随机播放", variant: "secondary" },
    { label: "数据源 · 新碟 banner + 分区推荐", variant: "neutral" },
    { label: "去重后合并 27 条", variant: "neutral" },
    { label: "显示模式 · 卡片 ▾", variant: "accent" },
  ],
  heroSection: {
    title: "精选 · 新碟 banner",
  },
  hero: {
    badge: "新碟 banner",
    ratioNote: "16:9 原始比例 · 不做方形裁切",
    tag: "独家首发",
    title: "《雨落长街》全专上线 · 官方无损音源",
    meta: "卧室音乐计划 · 2026-09-22 上线 · 专辑 12 首 · 总时长 46:18",
    tags: [
      { label: "无损 30251", variant: "quality" },
      { label: "杜比全景声 · 30250", variant: "plain" },
      { label: "与分区推荐共用播放队列", variant: "plain" },
    ],
    artVariant: "heroCard",
  },
  albumSection: {
    title: "新碟速报 · 方形专辑封面（new/music）",
  },
  /**
   * 3 张卡逐字取自设计稿第 8 页。**没有 ratioNote** —— 见 `FixtureAlbumCard` 的说明。
   * 首枚标签是「**想听** …」（1.3.19 订正：此前照原型写成了「畅销」）；
   * 封面按卡位次指名 `albumCard1/2/3` 三条纯平色，不做哈希挑选。
   */
  albums: [
    {
      badge: "独家首发",
      title: "《夏夜回声》",
      meta: "琴键上的猫",
      tags: [
        { label: "想听 1.2 万", variant: "accent" },
        { label: "无损", variant: "plain" },
      ],
      artVariant: "albumCard1",
    },
    {
      badge: "首发",
      title: "《夜航（录音室版）》",
      meta: "NOISE_LAB",
      tags: [
        { label: "想听 8,640", variant: "accent" },
        { label: "无损", variant: "plain" },
      ],
      artVariant: "albumCard2",
    },
    {
      badge: "新碟",
      title: "《器乐练习集 Vol.3》",
      meta: "卧室音乐计划",
      tags: [
        { label: "想听 3,120", variant: "accent" },
        { label: "高解析", variant: "plain" },
      ],
      artVariant: "albumCard3",
    },
  ],
  /**
   * 逐字取自原型注解带。注意它**无法用像素校验**：设计页第 8 页画板高 978，
   * 注解带墨迹在画板 841–876（900 视口折线以下），纠正参考图时已随折线裁掉。
   * 落地时按**页流**排在专辑网格之后（首屏不可见），不要贴视口底固定。
   */
  note: "这一屏补的都是接口已返回、界面没兑现的东西：new/music 的 cover 本是方形专辑图，唯一消费方却用 672w_378h_1c 裁成 16:9（项目已有 400w_400h_1c 方形范例），且该模块此前只挂在已被移除的「流行」Tab 上，活该落回本页；分区推荐的 rec_reason 与 stat:like / stat:danmaku 同样被适配器丢弃，displayMode 实为三档（card / list / compact）。",
  // 设计稿第 8 页播放栏逐字内容：曲名 / 副行 / 无损 30251 / 01:22 / 03:48 / 队列 · 12。
  // 82 / 228 = 36.0% —— 与原型的 width: 36% 一致，故两处是同一份数据。
  // 副行的 banner **是小写**（1.3.21 订正）：设计页第 8 页与第 3 页这一段逐像素一致，
  // 两页读出来都是小写；此前写成 `Banner` 是与屏 02 夹具不对齐的笔误。
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
