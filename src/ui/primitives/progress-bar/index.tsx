import { twMerge } from "tailwind-merge";

interface ProgressBarProps {
  /** 0..1 的完成度。超出范围会被夹到边界，不让异常数据把进度条画到容器外。 */
  value: number;
  /** 无障碍名称，例如「下载进度」。 */
  label: string;
  /**
   * 轨道宽度像素或 CSS 长度。原型：行内 190、下载列 220。
   * 播放栏不在此列 —— 设计稿实测 380（原型 392），由调用方传
   * `--biu-playbar-progress-w`，本组件不预设。
   */
  width?: number | string;
  /** 轨道高度像素。原型：3（迷你）、4（行内 / 下载 / 播放栏）。 */
  height?: number;
  /** 圆角。`sm` 为 2px（行内 / 迷你），`none` 为直角（沉浸态全宽进度）。 */
  radius?: "sm" | "none";
  /** 已完成部分的颜色，默认强调色。 */
  tone?: "accent" | "inverse";
  className?: string;
}

/**
 * 进度条。
 *
 * 轨道底与填充色都取自令牌：轨道 `--biu-veil-18`，填充 `--biu-accent`。
 *
 * 这里**只实现 18% 这一档轨道**：播放栏的槽底在 1.3.9 已按设计稿实测登记为 **18%**
 * （`--biu-veil-18`，见 spec-lock `material.playbar.progressTrack` —— 原型
 * `.pb-progress` 的 22% 是原型档，本轮已订正，本组件不需要第二档）。剩下的
 * 沉浸态原型写 24%，那一档等 P5 重建时按实测补录 —— 现在就把两档塞进同一个 API，
 * 等于凭猜测发明一档没有依据的默认值。
 *
 * 语义用 `role="progressbar"` 而不是 `<progress>`：原生元素在各浏览器里的
 * 内部结构不可控，无法按设计稿染轨道与填充。ARIA 属性由这里显式给出，
 * 读屏行为与原生一致。
 */
export const ProgressBar = ({
  value,
  label,
  width = 190,
  height = 4,
  radius = "sm",
  tone = "accent",
  className,
}: ProgressBarProps) => {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  const percent = clamped * 100;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
      className={twMerge(
        "flex-none overflow-hidden bg-[var(--biu-veil-18)]",
        radius === "sm" ? "rounded-[2px]" : "rounded-none",
        className,
      )}
      style={{ width, height }}
    >
      <span
        className={twMerge(
          "block h-full",
          radius === "sm" ? "rounded-[2px]" : "rounded-none",
          tone === "accent" ? "bg-[rgb(var(--biu-accent))]" : "bg-[rgb(var(--biu-inverse-surface))]",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};
