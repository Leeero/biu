import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

/**
 * 进度条的两种排布。原型里这是**两套不同的类**，取值也不同：
 *   `stacked` → `.dl-status`（下载列）：标签在上、条在下，条宽 220
 *   `inline`  → `.progress-inline`（行内）：标签与百分比在条的**两侧**，条宽 190
 * 两套的条高与圆角相同（4px / 2px 圆角），只是排布与宽度不同。
 */
export type InlineProgressOrientation = "stacked" | "inline";

const BAR_WIDTH: Record<InlineProgressOrientation, string> = {
  stacked: "220px",
  inline: "190px",
};

interface InlineProgressProps {
  label: ReactNode;
  /**
   * 0–100。**缺省表示「没有可量化的进度」** —— 原型里「已完成 · 可定位文件」
   * 与「任务出错 · 可重试」两行都只画标签、不画进度条。
   */
  percent?: number;
  /** 覆盖条宽。原型只有 190 / 220 两档，一般不需要传。 */
  barWidth?: string;
  orientation?: InlineProgressOrientation;
  className?: string;
}

/**
 * 行内 / 列内进度。
 *
 * 关于方案 §5.2 里记的 `state` 属性：**有意未实现**。原型里状态差异
 * **全部由 `label` 文字承担**（`下载中 · 62%` / `合并分块中 · 40%` /
 * `已完成 · 可定位文件` / `任务出错 · 可重试`），颜色与结构都没有变化。
 * 加一个 `state` 只会诱使人给「出错」染红 —— 那是发明设计稿里没有的视觉，
 * 而正确做法是由调用方把状态写进 `label`（或在外层配一个 `Tag variant="danger"`）。
 * 若将来确实需要区分色，先改 spec-lock 再实现。
 *
 * 进度条的 4px 高与 2px 圆角是**字面长度**：它们是本组件私有的细条几何，
 * 既不在字阶里也不在圆角档位里（圆角档最小是 6px），令牌化会造出一个
 * 只有一个消费者的档位。长度字面值不受 check-literals 约束（它只守颜色）。
 */
export const InlineProgress = ({
  label,
  percent,
  barWidth,
  orientation = "stacked",
  className,
}: InlineProgressProps) => {
  const width = barWidth ?? BAR_WIDTH[orientation];
  const clamped = percent === undefined ? undefined : Math.min(100, Math.max(0, percent));

  const bar =
    clamped === undefined ? null : (
      <div className="h-1 flex-none overflow-hidden rounded-[2px] bg-[var(--biu-veil-18)]" style={{ width }}>
        <span
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={clamped}
          aria-label={typeof label === "string" ? label : undefined}
          className="block h-full rounded-[2px] bg-[rgb(var(--biu-accent))]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    );

  const labelNode = (
    <span
      className={twMerge(
        "truncate text-[length:var(--biu-type-label-size)]",
        orientation === "stacked"
          ? "leading-5 text-[rgb(var(--biu-text-secondary))]"
          : "text-[rgb(var(--biu-text-secondary))] tabular-nums",
      )}
    >
      {label}
    </span>
  );

  if (orientation === "inline") {
    return (
      <div className={twMerge("flex items-center gap-[10px]", className)}>
        {bar}
        {labelNode}
      </div>
    );
  }

  return (
    <div className={twMerge("flex min-w-0 flex-col gap-[7px]", className)}>
      {labelNode}
      {bar}
    </div>
  );
};
