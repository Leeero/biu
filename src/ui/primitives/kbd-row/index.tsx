import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

interface KbdRowProps {
  /** 动作名，例如「播放 / 暂停」。 */
  label: ReactNode;
  /**
   * 键位，例如「Space」「⌘ ⇧ P」。
   * 原型用 `--biu-font-numeric` 渲染键位：等宽感让多行键位能对齐。
   */
  keys: ReactNode;
  /**
   * 快捷键冲突态。冲突时**整行**转危险色，不只染键位 ——
   * 只染键位的话，一行行扫过去很难发现哪一行出了问题。
   */
  conflict?: boolean;
  className?: string;
}

/**
 * 快捷键行（`.kbdrow` / `.kbdrow.is-conflict`）。
 *
 * 几何取自原型**后一处**定义（app.css 尾部的逐屏校正覆盖了前面的版本，以尾部为准）：
 * 高 22、字号 13、键位左边距 12。
 *
 * 语义用 `<dl>`：`<dt>` 是动作、`<dd>` 是键位，读屏会念成「播放 / 暂停：Space」，
 * 比两个并排的 `<span>` 清楚。注意 `<dt>/<dd>` 必须包在 `<dl>` 里，
 * 否则是无效 HTML（常见疏漏，浏览器不报错但辅助技术会乱）。
 */
export const KbdRow = ({ label, keys, conflict = false, className }: KbdRowProps) => (
  <dl
    className={twMerge(
      "flex h-[22px] items-baseline text-[length:var(--biu-type-label-size)]",
      conflict ? "text-[rgb(var(--biu-danger))]" : "text-[rgb(var(--biu-text-secondary))]",
      className,
    )}
    data-conflict={conflict || undefined}
  >
    <dt className="min-w-0 truncate">{label}</dt>
    <dd
      className={twMerge(
        "ml-3 font-[family-name:var(--biu-font-numeric)]",
        conflict ? "text-[rgb(var(--biu-danger))]" : "text-[rgb(var(--biu-text-tertiary))]",
      )}
    >
      {keys}
    </dd>
  </dl>
);
