import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

interface LyricsPanelProps {
  /** 面板顶部说明：`歌词 · B站字幕（AI 兜底）· 逐行高亮`。 */
  head?: ReactNode;
  /** 歌词行。字符串数组即可；需要逐行挂事件时用 `onSeek`。 */
  lines: readonly string[];
  /** 当前高亮行下标。不传则不强调任何一行。 */
  currentIndex?: number;
  /** 点行跳转。传入后每行成为按钮（键盘可达）；不传则是纯文本。 */
  onSeek?: (index: number) => void;
  className?: string;
}

/**
 * 歌词面板（原型 `.lyrics` / `.lyrics-head` / `.lyrics-line`）。
 *
 * 材质是**凹槽**而非玻璃：白 **13%** 底 + 玻璃描边 + 模糊 20。
 * 13% 是 `--biu-surface-sunken`。这里容易犯错 —— 看到「有描边 + 有模糊」
 * 就当成玻璃材质去用 `--biu-surface-glass`（16%），面板会比设计稿亮一档。
 * 判据是底色的深浅：凹槽比玻璃深，读起来像「内容沉在下面」，
 * 玻璃读起来像「浮在上面」。
 *
 * 行高 43px 而不是别的：`22px` 字号配 43px 行高（≈1.95）留出的空隙，
 * 让高亮行的切换看起来是「移动」而不是「重排」。这是原型尾部覆盖值
 * （app.css:2011），此前一处写的是 `1.7`。
 *
 * 非当前行的颜色是 `--biu-text-lyrics-dim`（白 56%）——**整值令牌**，
 * 不要再套 `rgb(var(--biu-text-primary) / 56%)`：那样得到的是二次调暗的
 * 半透明，与设计稿的 56% 白不是一回事。
 */
export const LyricsPanel = ({ head, lines, currentIndex, onSeek, className }: LyricsPanelProps) => (
  <div
    className={twMerge(
      "mt-5 rounded-[var(--biu-radius-lg)] border border-[var(--biu-glass-border)]",
      "bg-[var(--biu-surface-sunken)] px-[26px] pt-6 pb-[17px] backdrop-blur-[var(--biu-blur-glass)]",
      className,
    )}
  >
    {head !== undefined && head !== null && (
      <div className="mb-6 text-[length:var(--biu-type-small-size)] leading-6 text-[rgb(var(--biu-text-quaternary))]">
        {head}
      </div>
    )}

    {lines.map((line, index) => {
      const isCurrent = index === currentIndex;
      const lineClass = twMerge(
        "text-[22px] leading-[43px]",
        isCurrent ? "font-semibold text-[rgb(var(--biu-text-primary))]" : "text-[color:var(--biu-text-lyrics-dim)]",
      );

      // 无 onSeek 时用 <p>：歌词只是文本，挂一堆不可交互的 <button> 会让
      // 读屏用户逐个 Tab 走过整段歌词，反而更糟。
      if (!onSeek) {
        return (
          <p key={index} className={twMerge("m-0", lineClass)}>
            {line}
          </p>
        );
      }

      return (
        <button
          key={index}
          type="button"
          aria-current={isCurrent ? "true" : undefined}
          onClick={() => onSeek(index)}
          className={twMerge(
            "block w-full cursor-pointer text-left",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--biu-accent))]",
            lineClass,
          )}
        >
          {line}
        </button>
      );
    })}
  </div>
);
