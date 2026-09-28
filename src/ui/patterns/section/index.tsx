import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

/**
 * 分组间距。原型 `.section` 默认 20，逐屏校正给出 12 / 23 两档：
 *   `tight` 12（第 06 屏搜索结果：结果分组贴得更近）
 *   `base`  20（默认）
 *   `push`  23（第 07 屏发现音乐：首屏分组整体低 9px）
 */
export type SectionGap = "tight" | "base" | "push";

const GAPS: Record<SectionGap, string> = {
  tight: "mt-3",
  base: "mt-5",
  push: "mt-[23px]",
};

interface SectionProps {
  title?: ReactNode;
  /** 标题右侧的注释（原型 `.section-note`）。 */
  note?: ReactNode;
  gap?: SectionGap;
  /**
   * **屏级**间距覆写（像素）。给了它即压过 `gap` 档位与 `[&+&]` 段间约束
   * （行内 style 的特异性高于任意变体类），**同时**作用于首段外边距与段间距。
   *
   * 之所以有这条旁路：设计稿里「筛选条 → 首段」与「段 → 段」的间距是**逐屏不同**
   * 的实测值（第 07 屏两处同为 25，而缺省的档位是 20 与 27）。把每屏的值都加成
   * 一个档位，档位表会随屏数无限膨胀 —— 档位是跨屏复用的档，屏级值走这里。
   * 第 07 屏的出处：spec-lock `screens[06].rhythmImplementation.sectionGap`。
   */
  gapPx?: number;
  /**
   * **屏级**标题下距覆写（像素）。缺省读 `--biu-layout-section-head-mb`（8）。
   * 第 07 屏是 3（spec-lock `screens[06].rhythmImplementation.sectionHeadMarginBottom`）。
   */
  headMbPx?: number;
  children: ReactNode;
  className?: string;
}

/**
 * 分组（原型 `.section` / `.section-head` / `.section-title` / `.section-note`）。
 *
 * 标题是 `<h2>` 而不是 `<div>`：页面已有 `<h1>`（PageHeader），分组用 h2
 * 才能让读屏的标题大纲成立 —— 全是 div 时，用标题跳转的导航方式就失效了。
 *
 * **字号 16 走独立档 `--biu-type-section-title-size`，不借 `--biu-type-small-size`（17）**
 * —— spec-lock 1.3.24（原型—设计稿第 11 处分歧）。设计稿的段标题实测 16.0（汉字
 * advance = 1em，第 09 页连续 8 段步进 16），而 small 档的角色是「歌词与浮层小字」，
 * 另有歌词面板 / 信息面板 / 专辑卡 / 对话框四处消费方 —— 借档改字就等于替那四处
 * 一并做了决定。行盒仍是 `leading-6`（24px），与令牌的 leading 1.5 一致，改字号不挪 y。
 *
 * 标题与栅格的间距 8px 来自设计稿第 2 页实测（`--biu-layout-section-head-mb`，
 * spec-lock geometry.sectionHead）：标题墨迹下缘 → 瓦片顶缘两处一致 12px，
 * 扣墨迹—盒缘偏移 4px 即 margin 8。原型 .section-head 的 4px 是原型—设计稿
 * 第 4 处分歧，实现按设计稿。
 *
 * 注意 `.section + .section` 的 27px 是用 `[&+&]` 复刻的，它比 `gap` 的
 * 单类选择器特异性更高，会覆盖首段的间距。这是有意为之：原型里
 * 「第一段到标题」与「段与段之间」本来就是两个值，`gap` 只管前者。
 */
export const Section = ({ title, note, gap = "base", gapPx, headMbPx, children, className }: SectionProps) => (
  <section
    className={twMerge(GAPS[gap], gapPx === undefined && "[&+&]:mt-[27px]", className)}
    // 行内 marginTop 同时盖住首段与 `[&+&]` 段间 —— 第 07 屏两处同值，一条就够。
    style={gapPx === undefined ? undefined : { marginTop: gapPx }}
  >
    {title && (
      <header
        className="mb-[var(--biu-layout-section-head-mb)] flex items-baseline justify-between gap-4"
        style={headMbPx === undefined ? undefined : { marginBottom: headMbPx }}
      >
        <h2 className="m-0 text-[length:var(--biu-type-section-title-size)] leading-6 font-semibold text-[rgb(var(--biu-text-primary))]">
          {title}
        </h2>
        {note && (
          <span className="text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]">
            {note}
          </span>
        )}
      </header>
    )}
    {children}
  </section>
);
