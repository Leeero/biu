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
  /** 发现音乐大卡封面 `.hero-art`（卡片分支） */
  heroCard: "linear-gradient(150deg, #1b2131, #14161d)",
  /** 发现音乐大卡封面 `.hero-art`（列表分支） */
  heroList: "linear-gradient(150deg, #2b3550, #14161d)",
  /** 沉浸态封面 `.np-art` */
  immersive: "linear-gradient(150deg, #242b3d, #171c28)",
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
