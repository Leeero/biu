import type { DragEvent, ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import type { IconName } from "@/ui/primitives/icon";

import { Artwork } from "@/ui/primitives/artwork";
import { GlassButton } from "@/ui/primitives/glass-button";

import { useTrackTable } from "./context";

export interface TrackTableRowProps {
  /** 领域 ID。与表格的 `currentId` 相等时该行成为当前行。 */
  trackId?: string;
  /** 显式指定当前行，优先于 `currentId` 比对（同屏出现两张表时用得上）。 */
  current?: boolean;
  /**
   * 行在列表中的 0 基位置。**只在需要拖拽重排时提供**。
   *
   * 之所以不自动推断位置：行是以 `children` 传进来的任意节点，可能是
   * 条件渲染、可能是 Fragment，靠 `Children.toArray` 推断会在这些情况下
   * 悄悄错位 —— 错位的重排比不能重排更糟。显式传位置时，调用方自己知道
   * 传的是第几行。
   */
  position?: number;
  className?: string;
  children: ReactNode;
}

/**
 * 轨道行。
 *
 * 三个细节必须照原型来，否则列表会「差一点」：
 *
 * 1. **行高 68、无分隔线**。设计稿列表没有 1px 分隔线，行的边界靠
 *    68px 的行高与当前行的圆角高亮表达。上一轮的实现在这里加过分隔线。
 * 2. **高亮是整行通铺 + 上下内缩 2px**，用 `::before` 画而不是背景色 ——
 *    这样高亮可以盖住内容宽度（左右通栏）而不受 grid 列宽影响。
 *    `inset` 的 2px 取自 `--biu-layout-current-inset`。
 * 3. **悬停 4% / 当前 7%，当前态压过悬停态**。原型里 `.is-current::before`
 *    写在 `:hover::before` 之后，所以悬停当前行仍是 7%。Tailwind 的变体
 *    输出顺序不保证与书写顺序一致，因此这里**显式重述**了一条
 *    `hover:data-[current]:` 规则把它钉死，而不是赌生成顺序。
 *
 * 关于 `onReorder`：原型**没有任何重排交互**（队列页也不可拖）。它是重构方案
 * §5.2 冻结的 API 占位，供 P5 队列页使用。这里只实现原生拖放，
 * **有意不给行加 `tabIndex`**：214 行会变成 214 个 Tab 停留点，键盘用户会被
 * 困在列表里。真正的键盘重排入口应当由行内操作菜单提供
 * （「移到上一首 / 下一首」），在 P5 队列页落地 —— 那时也只是调用同一个
 * `onReorder`，不需要再改这里的签名。
 */
export const TrackTableRow = ({ trackId, current, position, className, children }: TrackTableRowProps) => {
  const { gridTemplate, currentId, onReorder } = useTrackTable();
  const isCurrent = current ?? (trackId !== undefined && trackId === currentId);
  const draggable = onReorder !== undefined && position !== undefined;

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (position === undefined) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(position));
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!onReorder || position === undefined) return;
    const from = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isInteger(from) && from !== position) onReorder(from, position);
  };

  return (
    <div
      data-current={isCurrent ? "" : undefined}
      draggable={draggable || undefined}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragOver={draggable ? handleDragOver : undefined}
      onDrop={draggable ? handleDrop : undefined}
      className={twMerge(
        "relative grid h-[var(--biu-layout-row-h)] items-center pr-[var(--biu-layout-list-pad-r)]",
        // 行高亮：整行通铺、上下内缩、圆角 8（原型 --r-chip）。不响应指针。
        "before:pointer-events-none before:absolute before:inset-x-0",
        "before:top-[var(--biu-layout-current-inset)] before:bottom-[var(--biu-layout-current-inset)]",
        "before:rounded-[var(--biu-radius-sm)] before:bg-transparent before:content-['']",
        "hover:before:bg-[var(--biu-veil-4)]",
        "data-[current]:before:bg-[var(--biu-surface-current)]",
        "hover:data-[current]:before:bg-[var(--biu-surface-current)]",
        draggable && "cursor-grab active:cursor-grabbing",
        className,
      )}
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {children}
    </div>
  );
};

/** 行内所有 cell 都要抬到高亮层之上（原型 `.track-row > * { z-index: 1 }`）。 */
const CELL_LAYER = "relative z-[1]";

interface TrackIndexProps {
  /** 行号。原型全部实例都是两位零填充（`01`…`05`），按此默认格式化。 */
  value?: number;
  children?: ReactNode;
  className?: string;
}

/** 序号列。原型 `.track-index`：13px、四级文字、等宽数字。 */
export const TrackIndex = ({ value, children, className }: TrackIndexProps) => (
  <div
    className={twMerge(
      CELL_LAYER,
      "text-[length:var(--biu-type-label-size)] text-[rgb(var(--biu-text-quaternary))]",
      "tabular-nums",
      className,
    )}
  >
    {children ?? (value === undefined ? null : String(value).padStart(2, "0"))}
  </div>
);

interface TrackMainProps {
  children: ReactNode;
  className?: string;
}

/** 标题列（图 + 文）。原型 `.track-main`：flex、图→文 31px、可收缩。 */
export const TrackMain = ({ children, className }: TrackMainProps) => (
  <div className={twMerge(CELL_LAYER, "flex min-w-0 items-center gap-[var(--biu-layout-track-gap)]", className)}>
    {children}
  </div>
);

interface TrackArtProps {
  src?: string;
  /** 稳定占位键（通常是领域 ID），保证同一内容每次拿到同一占位色。 */
  artKey?: string;
  alt?: string;
  /** 原型 `.track-art--disc`：圆形缩略图，用于本地音乐/专辑行。 */
  shape?: "rect" | "disc";
  className?: string;
}

/** 行内缩略图。原型 `.track-art`：固定 100 × 56、圆角 6。 */
export const TrackArt = ({ src, artKey, alt = "", shape = "rect", className }: TrackArtProps) => (
  <Artwork
    src={src}
    artKey={artKey}
    alt={alt}
    radius={shape === "disc" ? "round" : "art"}
    gradient={shape === "disc" ? "disc" : "linear"}
    className={twMerge("h-[var(--biu-layout-art-h)] w-[var(--biu-layout-art-w)] flex-none", className)}
  />
);

interface TrackTextProps {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}

/** 标题 + 副标题。原型 `.track-text` / `.track-name` / `.track-sub`。 */
export const TrackText = ({ title, subtitle, className }: TrackTextProps) => (
  <div className={twMerge(CELL_LAYER, "min-w-0", className)}>
    <div
      className={twMerge(
        "truncate text-[length:var(--biu-type-body-size)] font-semibold",
        "text-[rgb(var(--biu-text-primary))]",
      )}
    >
      {title}
    </div>
    {subtitle !== undefined && subtitle !== null && (
      <div
        className={twMerge(
          "mt-[6px] truncate text-[length:var(--biu-type-label-size)]",
          "text-[rgb(var(--biu-text-quaternary))]",
        )}
      >
        {subtitle}
      </div>
    )}
  </div>
);

interface TrackCellProps {
  children?: ReactNode;
  align?: "start" | "end";
  /** 原型 `.track-cell.is-danger`：用于「2 处冲突」这类需要警示的取值。 */
  tone?: "normal" | "danger";
  className?: string;
}

/** 普通列。原型 `.track-cell`：13px、四级文字、等宽数字、单行截断。 */
export const TrackCell = ({ children, align = "start", tone = "normal", className }: TrackCellProps) => (
  <div
    className={twMerge(
      CELL_LAYER,
      "truncate text-[length:var(--biu-type-label-size)] tabular-nums",
      tone === "danger" ? "text-[rgb(var(--biu-danger))]" : "text-[rgb(var(--biu-text-quaternary))]",
      align === "end" && "text-right",
      className,
    )}
  >
    {children}
  </div>
);

export interface TrackActionSpec {
  key: string;
  /** 无障碍名称。圆片按钮没有可见文字，这个必填。 */
  label: string;
  icon: IconName;
  onPress?: () => void;
  disabled?: boolean;
}

interface TrackTableActionsProps {
  /** 主操作（38px 反色圆片）。原型固定是播放。 */
  primary?: TrackActionSpec;
  /** 其余图标操作。原型 `.track-actions` 固定为上一首 / 下一首 / 加入队列 / 收藏 / 下载。 */
  actions?: readonly TrackActionSpec[];
  className?: string;
}

/**
 * 行内悬浮操作带。原型 `.track-actions`。
 *
 * 只实现到「带子的视觉与内容」，**不实现露出逻辑**：原型里带子的显隐由
 * 行悬停 / 当前态决定，而这个决定属于调用方（列表容器知道鼠标在哪一行）。
 * 浏览器里用 `group/row` 或状态控制 `hidden` / `opacity-0`，交给各屏自己写，
 * 因为「悬停露出」与「选中露出」在原型里并不一致。
 *
 * 带子用 `position: absolute` 定位，因此**不占 grid 列**：原型里它是
 * `.track-row` 的第 5 个子元素，而 grid 只有 4 列。
 */
export const TrackTableActions = ({ primary, actions, className }: TrackTableActionsProps) => (
  <div
    className={twMerge(
      // z-index 3：压过行高亮（1）与行内容（1）。原型同此。
      "absolute top-1/2 right-[24px] z-[3] inline-flex -translate-y-1/2 items-center gap-[4px]",
      // 玻璃材质写在**带子**上，不是写在按钮上（见 GlassButton 的 tone 说明）。
      "rounded-[var(--biu-radius-pill)] border border-[var(--biu-veil-18)] bg-[var(--biu-veil-14)]",
      "p-[5px_6px] backdrop-blur-[var(--biu-blur-glass)]",
      className,
    )}
  >
    {primary && (
      <GlassButton
        tone="inverse"
        size={38}
        iconSize={17}
        label={primary.label}
        icon={primary.icon}
        disabled={primary.disabled}
        onClick={primary.onPress}
      />
    )}
    {primary && actions && actions.length > 0 && <TrackActionSeparator />}
    {actions?.map(action => (
      <GlassButton
        key={action.key}
        tone="bare"
        size={30}
        // 原型 `.track-actions .round { font-size: 15px }` —— 30px 圆片配 15px 图标，
        // 比例 0.5，与其它档位的 0.45 不同，所以显式给值而不是走默认推算。
        iconSize={15}
        label={action.label}
        icon={action.icon}
        disabled={action.disabled}
        onClick={action.onPress}
      />
    ))}
  </div>
);

/** 操作带内的分隔线。原型 `.track-actions .sep`：1 × 18、白色 20%。 */
export const TrackActionSeparator = () => (
  <span aria-hidden className="mx-[2px] h-[18px] w-px bg-[var(--biu-veil-20)]" />
);
