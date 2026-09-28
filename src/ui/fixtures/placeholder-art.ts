/**
 * 封面 / 头像占位渐变。
 *
 * 这里是 **check-literals 唯一放行的数据豁免文件**，理由不是「懒得改成令牌」，
 * 而是这些值在设计上就不是设计令牌：
 *
 *   · 真实封面与头像来自数据源，设计稿里的那些图重构时拿不到；
 *   · 用一套稳定的渐变代替，是为了让保真度比对可复现（否则每换一条数据，
 *     截图就变一次，报出的差异分不清是「实现走样」还是「数据本来就不同」）；
 *   · 因此它们属于**数据夹具**，与 `palette.css` 的颜色是两个范畴。
 *     把数据混进色板会让「这个颜色代表什么设计意图」变得无法回答。
 *
 * 约束（由 tools/design-fidelity/check-literals.mjs 与 tests/ui-components.test.tsx 共同强制）：
 *   1. 本文件只允许出现占位渐变，不得出现任何 `palette.css` 里已有的设计令牌值。
 *      一旦出现，说明有人把视觉决策混进了数据。
 *   2. 渐变清单必须与 `tools/design-fidelity/fixtures/placeholder-art.json` 逐字一致，
 *      该 JSON 是 `verify.py` 在 `--target prototype` 下读的同一份数据。
 *   3. 只能用于封面、头像、频谱等**影像区域**的占位填充。
 *      禁止用于任何控件底色、文字、描边 —— 那些必须走设计令牌。
 *
 * 用法：`import { placeholderArt } from "@/ui/fixtures/placeholder-art";`
 * 该模块不导出任何 React 组件，只提供数据与选择函数，组件自行决定怎么画。
 */

/** 线性渐变（16:9 封面等）。顺序与 fixtures/placeholder-art.json 的 gradients 一致。 */
export const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(150deg, #2b3550, #171a24)",
  "linear-gradient(150deg, #30303a, #1a1a1f)",
  "linear-gradient(150deg, #333940, #191d20)",
  "linear-gradient(150deg, #333c37, #191d1b)",
  "linear-gradient(150deg, #343a42, #1a1d21)",
  "linear-gradient(150deg, #35405c, #191d28)",
  "linear-gradient(150deg, #383644, #1c1b22)",
  "linear-gradient(150deg, #3a3a46, #1c1c22)",
  "linear-gradient(150deg, #3b352c, #201d18)",
  "linear-gradient(150deg, #3c3644, #1d1b22)",
  "linear-gradient(150deg, #3d3a33, #1e1d19)",
  "linear-gradient(150deg, #403a4c, #1d1b24)",
  "linear-gradient(150deg, #42402f, #22211a)",
] as const;

/** 无可匹配内容时的默认封面渐变，与原型 `.tile-art` 的 fallback 一致。 */
export const DEFAULT_COVER_GRADIENT = "linear-gradient(150deg, #2f2f37, #17171b)";

/** 圆形式占位（头像、碟片、大卡封面）。顺序与 fixtures 的 radialVariants 一致。 */
export const PLACEHOLDER_RADIALS = {
  /** 用户头像 `.avatar` */
  avatar: "radial-gradient(120% 120% at 30% 20%, #55555a, #2f2f33)",
  /** 碟片缩略图 `.track-art--disc` */
  disc: "radial-gradient(120% 120% at 30% 25%, #4a4a52, #1c1c21 70%)",
  /** 创作者头像 `.creator-face` */
  face: "radial-gradient(120% 120% at 30% 25%, #4d4d55, #1e1e23 72%)",
  /**
   * 发现音乐大卡封面 `.hero-art`（**卡片分支**，屏 07）。
   *
   * 设计稿第 8 页实测为**纯平色** `#1b2131`（窗口 x150–400 / y430–520，
   * 「不同色数 = 1」逐点相同）。这里写**等值渐变**的理由与 `playbarCover` 同：
   * `Artwork` 走 `background-image` 通道，平色不是合法值。
   *
   * **不能退回 1.3.16 那句「与渐变起点逐通道相同就用渐变」**：起点相同只保证左上角
   * 一致，封面其余部分会一路暗到 `#14161d`，整片封面比稿面暗一档。
   * 列表分支（屏 08）是另一条固定渐变，见 `heroList`。
   */
  heroCard: "linear-gradient(150deg, #1b2131, #1b2131)",
  /**
   * 发现音乐**专辑卡**封面 `.album-art`（屏 07 三张，按卡位次命名）。
   *
   * 设计稿第 8 页三张封面同样是**纯平色**，且三张各不同：
   * `#2b2b33 (43,43,51)` / `#33313a (51,49,58)` / `#36322c (54,50,44)`
   * —— 「不同色数 = 1」。
   *
   * 夹具原先按原型取 `gradients[5 / 11 / 12]`（150° 渐变），**这不是画风差异**：
   * 那三条渐变的起点亮度 69.7 高于内容带探针的阈值 60，于是封面顶部整片被判成
   * 墨迹，把封面左侧徽标的墨迹**并进同一条带**，屏 07 的内容带覆盖率因此只有 60%
   * （spec-lock 1.3.19 第 ④ 条）。数据夹具的亮度是会进闸门的。
   */
  albumCard1: "linear-gradient(150deg, #2b2b33, #2b2b33)",
  albumCard2: "linear-gradient(150deg, #33313a, #33313a)",
  albumCard3: "linear-gradient(150deg, #36322c, #36322c)",
  /** 发现音乐大卡封面 `.hero-art`（列表分支，屏 08） */
  heroList: "linear-gradient(150deg, #2b3550, #14161d)",
  /**
   * 发现音乐**列表行缩略图** `.track-art`（屏 08 五行，按行位次命名）。
   *
   * 设计稿第 9 页五行缩略图各自是**纯平色**（窗口 x122–218 / y+2…+54 内
   * 不同色数 4–7，最大偏差 3 —— 压缩噪声量级）：
   * `#252731 (37,39,49)` / `#2b2934 (43,41,52)` / `#2f2c29 (47,44,41)` /
   * `#292d2b (41,45,43)` / `#2d2932 (45,41,50)`。
   *
   * 同样写成**等值渐变**（`Artwork` 走 `background-image` 通道，平色不是合法值），
   * 并**按行指名**、不做哈希挑选 —— 与屏 07 的整张专辑卡同一处置。
   *
   * 亮度也照内容带探针核过：五条的代表值亮度 41.7 / 45.3 / 44.0 / 43.0 / 45.3，
   * 全部低于内容带阈值 60（屏 07 的占位就是栽在这一点上，见 `albumCard1` 的说明）。
   */
  listRow1: "linear-gradient(150deg, #252731, #252731)",
  listRow2: "linear-gradient(150deg, #2b2934, #2b2934)",
  listRow3: "linear-gradient(150deg, #2f2c29, #2f2c29)",
  listRow4: "linear-gradient(150deg, #292d2b, #292d2b)",
  listRow5: "linear-gradient(150deg, #2d2932, #2d2932)",
  /** 沉浸态封面 `.np-art` */
  immersive: "linear-gradient(150deg, #242b3d, #171c28)",
  /**
   * 播放栏封面 `.pb-cover`。
   *
   * 设计稿第 03/04/09/13 页的播放栏封面实测为**纯平色** `#282932`
   * （窗口 x35–129 / y831–881，共 4700 像素，标准差 0.00）—— 稿面的封面位
   * 就是一个平色占位矩形。这里写成 **等值渐变**（起止同色）而不是平色，
   * 唯一原因是 `Artwork` 用 `background-image` 通道填占位，而平色不是合法的
   * `background-image` 值（会被浏览器丢弃，封面会退回元件底色）。
   *
   * 第 02/05 页的同一位置是渐变（标准差 ≈ 19.8）—— 封面位在稿面上本就是
   * 「具体作品拿不到」的可变占位，不是一个规格值，故不按页分别登记。
   */
  playbarCover: "linear-gradient(150deg, #282932, #282932)",
} as const;

export type PlaceholderRadial = keyof typeof PLACEHOLDER_RADIALS;

/**
 * 由任意稳定键（通常是领域 ID）选出一个渐变。
 *
 * 必须是**确定性**的：同一条曲目每次渲染都要拿到同一个占位色。
 * 用 `Math.random()` 会让列表每次滚动都换色，既刺眼，也让截图比对失去意义。
 * 用 `id` 而不是数组下标，则是为了让「筛选后顺序变了」不会导致封面跳色。
 */
export const pickPlaceholderGradient = (key: string | undefined): string => {
  if (!key) return DEFAULT_COVER_GRADIENT;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) | 0;
  }
  return PLACEHOLDER_GRADIENTS[Math.abs(hash) % PLACEHOLDER_GRADIENTS.length]!;
};
