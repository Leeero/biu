import type { ComponentType, ReactNode } from "react";

import {
  RiAddLine,
  RiArrowRightLine,
  RiCheckLine,
  RiDeleteBin6Line,
  RiDownload2Line,
  RiExpandDiagonalLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiFileMusicLine,
  RiFolder2Line,
  RiFolderOpenLine,
  RiGridLine,
  RiHeart3Line,
  RiHistoryLine,
  RiListCheck2,
  RiListUnordered,
  RiMicLine,
  RiMore2Line,
  RiMusic2Line,
  RiPauseFill,
  RiPlayFill,
  RiPlayListAddLine,
  RiRefreshLine,
  RiRepeat2Line,
  RiRepeatOneLine,
  RiSearchLine,
  RiSettings3Line,
  RiShuffleLine,
  RiSkipBackFill,
  RiSkipForwardFill,
  RiSparkling2Line,
  RiVolumeUpLine,
} from "@remixicon/react";
import { twMerge } from "tailwind-merge";

/**
 * 图标词汇表。
 *
 * 键名与原型 `assets/icons.js` 的 `i-*` 精灵名一一对应（去掉 `i-` 前缀），
 * 这样「设计稿用了哪些图标」与「代码里能用哪些图标」是同一份清单，可以直接对照。
 *
 * 为什么要有注册表，而不是各页面直接 import 图标组件：
 *   1. 词汇表是**设计资产**，需要能被穷举与展示（见 /design-system 的图标展位）；
 *      散落的 import 无法回答「我们一共用了多少种图标」。
 *   2. 换图标时要改一处，而不是全局搜索替换。
 *   3. 设计稿出现 remixicon 没有的图标时，这里就是登记内联 SVG 兜底的位置。
 *
 * 原型 `icons.js` 的 36 个精灵名基本逐项对应，未收录的是纯演示性符号
 * （`i-photo` / `i-locate` 等，属原型占位而非产品能力）。
 */
export const ICONS = {
  search: RiSearchLine,
  play: RiPlayFill,
  pause: RiPauseFill,
  prev: RiSkipBackFill,
  next: RiSkipForwardFill,
  shuffle: RiShuffleLine,
  "queue-add": RiPlayListAddLine,
  heart: RiHeart3Line,
  download: RiDownload2Line,
  more: RiMore2Line,
  repeat: RiRepeat2Line,
  "repeat-one": RiRepeatOneLine,
  list: RiListUnordered,
  grid: RiGridLine,
  disk: RiFileMusicLine,
  folder: RiFolder2Line,
  "folder-open": RiFolderOpenLine,
  trash: RiDeleteBin6Line,
  refresh: RiRefreshLine,
  external: RiExternalLinkLine,
  video: RiEyeLine,
  music: RiMusic2Line,
  mic: RiMicLine,
  expand: RiExpandDiagonalLine,
  check: RiCheckLine,
  "arrow-right": RiArrowRightLine,
  volume: RiVolumeUpLine,
  gear: RiSettings3Line,
  plus: RiAddLine,
  history: RiHistoryLine,
  sparkle: RiSparkling2Line,
  /** 批量选择 / 多选模式的列表图标，原型 `i-list` 的变体 */
  "list-check": RiListCheck2,
} as const;

export type IconName = keyof typeof ICONS;

/**
 * 注册表值的结构类型。
 *
 * 这里**不用 `satisfies` 约束成 remixicon 自己的类型**：`RemixiconComponentType`
 * 没有从包里导出，而结构等价的写法会因为 remixicon 声明了 `children?: never`
 * 而在逆变检查上失败。改为「让 TS 推断注册表类型」，渲染时再做一次显式窄化 ——
 * `IconName` 因此仍是精确的键联合（拼错图标名会编译失败），
 * 代价是放弃了对图标组件签名的静态校验（有 UI 测试兜底）。
 */
type IconGlyphProps = { size?: number | string; className?: string; color?: string };

interface IconProps {
  /** 词汇表键名。与 `children` 二选一。 */
  name?: IconName;
  /** 直接传入图标组件。仅在尚未进词汇表时使用，用后应补登记。 */
  children?: ReactNode;
  /** 像素尺寸。默认跟随父级 font-size（`1em`），与原型 `svg.i` 一致。 */
  size?: number | string;
  className?: string;
}

/**
 * 图标。
 *
 * 三条几何约定直接来自原型 `svg.i`：`width/height: 1em`、`fill: currentColor`、
 * `flex: none`。第三条尤其重要 —— 列表行与药丸都是 flex 容器，图标缺了 `flex: none`
 * 会被压缩变形，而这种问题在小尺寸下肉眼难察。
 *
 * 默认尺寸跟随字体（`1em`），因此「把图标调大」的常规做法是给容器定字号，
 * 而不是逐个图标写像素值 —— 设计稿里图标与文字的字号关系本来就是这样定义的。
 *
 * **不转发任意 SVG 属性**：C+ 里的图标一律是装饰（含义由旁边的文字承担），
 * 因此恒为 `aria-hidden`。需要被读屏识别的图标应当用 `IconButton` 这类
 * 带 `aria-label` 的组件，而不是给 `<svg>` 挂个名字。
 */
export const Icon = ({ name, children, size, className }: IconProps) => {
  const Glyph = name ? (ICONS[name] as unknown as ComponentType<IconGlyphProps>) : null;
  const resolved = size ?? "1em";

  if (!Glyph && !children) return null;

  return (
    <span
      aria-hidden="true"
      className={twMerge("inline-flex flex-none items-center justify-center", className)}
      style={{ width: resolved, height: resolved }}
    >
      {Glyph ? <Glyph aria-hidden="true" className="block size-full fill-current" /> : children}
    </span>
  );
};
