import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

/**
 * 注解带位置。原型 `.note` 的六个变体，取值与 `cplus-spec-lock.json`
 * 的 `screens[].anchors.noteTop` 一一对应：
 *
 *   （缺省）653  02 / 03 / 05 / 08 / 09 / 11 屏
 *   `high`  598  第 06 屏搜索结果
 *   `low`   693  第 01 屏我的音乐库
 *   `lower` 694  第 04 屏本地音乐
 *   `lowest` 698 第 07 屏发现音乐
 *   `footer` 704 第 12 屏迷你播放器（12 屏中最低）
 *   `inline` 随内容排布（第 10 屏正在播放：沉浸态没有固定高度可锚）
 */
export type NoteAnchor = "high" | "low" | "lower" | "lowest" | "footer" | "inline";

/** 锚点 → 相对内容区顶部的 y。缺省档不列在这里，用基准值表达。 */
const ANCHOR_TOP: Record<Exclude<NoteAnchor, "inline">, number> = {
  high: 598,
  low: 693,
  lower: 694,
  lowest: 698,
  footer: 704,
};

/** 基准 y（无锚点时），对应 `screens[].anchors.noteTop` 的众数 653。 */
export const NOTE_BASE_TOP = 653;

interface AnnotationBandProps {
  anchor?: NoteAnchor;
  children: ReactNode;
  className?: string;
}

/**
 * 注解带（原型 `.note`）。
 *
 * 这不是调试信息，而是 C+ 这个设计方案的组成部分：设计稿把「这一屏能做什么」
 * 直接写在界面底部，让能力可读。6 个位置变体已登记在真值里，不要自己算 y。
 *
 * 定位用 `position: absolute` 且左右各留一个 gutter，这与原型一致 ——
 * 它是叠在内容之上的说明，不占内容高度，否则每屏的内容高度都要为它让位。
 * `inline` 档是例外：沉浸态没有固定高度，注解随内容走。
 *
 * 前面的 8×8 色块是**标记而非装饰**：它让读者一眼分辨「这是注解」而不是正文。
 * 用强调色是设计稿的规定，不要换成中性色 —— 换成灰的就会混进正文里。
 *
 * `pointer-events-none` 是重构新增的，原型不需要（原型没有交互）：
 * 注解带叠在 y=653 等内容之上，列表滚动时行会经过它。若让它可以接收指针事件，
 * 那块区域的行就点不动了 —— 这类「有一部分点不动」的问题极难定位。
 * 代价是注解文字不可选中；需要可选中时用 `anchor="inline"` 把它排进内容流。
 */
export const AnnotationBand = ({ anchor, children, className }: AnnotationBandProps) => {
  const isInline = anchor === "inline";

  return (
    <p
      className={twMerge(
        "z-[var(--biu-z-note)] m-0 flex items-start gap-3",
        "text-[length:var(--biu-type-label-size)] leading-[20.8px] text-[rgb(var(--biu-text-quaternary))]",
        isInline
          ? "relative mt-6"
          : "pointer-events-none absolute right-[var(--biu-layout-gutter)] left-[var(--biu-layout-gutter)]",
        className,
      )}
      style={isInline ? undefined : { top: anchor ? ANCHOR_TOP[anchor] : NOTE_BASE_TOP }}
    >
      <span aria-hidden="true" className="mt-[6.4px] size-2 flex-none bg-[rgb(var(--biu-accent))]" />
      <span>{children}</span>
    </p>
  );
};
