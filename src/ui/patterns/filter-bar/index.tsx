import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

/**
 * 与上一段内容的间距。原型 `.filterbar` 默认 20，逐屏校正给出三档：
 *   `tight` 12（第 01 屏我的音乐库）
 *   `base`  20（默认）
 *   `flat`  15（第 07 屏：标题列 `head-main--flat` 之后紧随导语）
 *   `loose` 24（第 04 屏本地音乐）
 *
 * `flat` 之所以单列一档而不是让 PageHeader 去覆写筛选条的外边距：
 * 跨组件用后代选择器改间距，会让「间距是谁定的」变得无法回答。
 * 原型里它确实是 `.head-main--flat .filterbar` 这条后代规则，但那是原型
 * 只有一层 div 的写法；组件化之后，把值交给调用方显式指定更清楚。
 */
export type FilterBarGap = "tight" | "base" | "flat" | "loose";

const GAPS: Record<FilterBarGap, string> = {
  tight: "mt-3",
  base: "mt-5",
  flat: "mt-[15px]",
  loose: "mt-6",
};

interface FilterBarProps {
  /** 无障碍名称。筛选条是一组按钮，读屏需要知道这组按钮管什么。 */
  label: string;
  gap?: FilterBarGap;
  /**
   * **屏级**间距覆写（像素）。给了它即压过 `gap` 档位 —— 与 `Section.gapPx`
   * 同一个理由：设计稿里这个间距逐屏不同（第 07 屏 13，而档位表里最接近的
   * `flat` 是 15），把每屏的值都加成档位会让档位表随屏数膨胀。
   * 第 07 屏的出处：spec-lock `screens[06].rhythmImplementation.filterMarginTop`。
   */
  gapPx?: number;
  children: ReactNode;
  className?: string;
}

/**
 * 筛选条（原型 `.filterbar`）。
 *
 * 几何是 L1 硬锚点：条高 **48**（`--biu-layout-filterbar-h`）、内边距 6、
 * 药丸间隔 4、药丸高 36（`--biu-layout-pill-h`）。这三个值参与自动比对，
 * 不要改成别的数。
 *
 * 底色是 `--biu-surface-sunken`（白 13%），比药丸自身的底色深一档，
 * 这样未选中的药丸在条内才看得出层次 —— 两者同色的话筛选条会糊成一块。
 *
 * 用 `role="group"` 而不是 `role="toolbar"`：toolbar 承诺方向键在按钮间移动，
 * 而这里没有实现 roving tabindex，用 Tab 逐个走。不给兑现不了的语义承诺。
 */
export const FilterBar = ({ label, gap = "base", gapPx, children, className }: FilterBarProps) => (
  <div
    role="group"
    aria-label={label}
    className={twMerge(
      "inline-flex h-[var(--biu-layout-filterbar-h)] items-center gap-[var(--biu-layout-pill-gap)]",
      "rounded-[var(--biu-radius-pill)] bg-[var(--biu-surface-sunken)] px-[var(--biu-layout-pill-pad)]",
      gapPx === undefined && GAPS[gap],
      className,
    )}
    style={gapPx === undefined ? undefined : { marginTop: gapPx }}
  >
    {children}
  </div>
);
