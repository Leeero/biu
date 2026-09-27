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

/**
 * 行内所有 cell 都要抬到高亮层之上（原型 `.track-row > * { z-index: 1 }`）。
 *
 * ⚠️ 本文件里 `leading-*` 必须写在**字号类之后**。
 *
 * tailwind-merge 把 `font-size` 与 `leading` 登记为冲突组（因为 Tailwind 的
 * `text-lg` 同时给出字号与行高），于是 `twMerge("leading-none text-[length:…]")`
 * 会把 `leading-none` **静默丢掉** —— 类名不在 DOM 上、样式照样生效不了，肉眼与
 * 快照都看不出来。本文件此前四处 `leading-none` 全是这个写法，一个都没生效
 * （行内单元格实测 line-height = 19.5px = 13 × 继承来的 1.5）。字面顺序即语义。
 */
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
      "text-[length:var(--biu-type-label-size)] leading-none text-[rgb(var(--biu-text-quaternary))]",
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
  /** 显式占位渐变（完整 background-image 值），给定即逐字采用（夹具/演示位）。 */
  placeholder?: string;
  alt?: string;
  /** 原型 `.track-art--disc`：圆形缩略图，用于本地音乐/专辑行。 */
  shape?: "rect" | "disc";
  className?: string;
}

/** 行内缩略图。原型 `.track-art`：固定 100 × 56、圆角 6。 */
export const TrackArt = ({ src, artKey, placeholder, alt = "", shape = "rect", className }: TrackArtProps) => (
  <Artwork
    src={src}
    artKey={artKey}
    placeholder={placeholder}
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

/**
 * 标题 + 副标题。原型 `.track-text` / `.track-name` / `.track-sub`。
 *
 * 两处**不照原型**（真值优先，详见 spec-lock `geometry.list.trackText`）：
 *
 * 1. **标题 17px，不是原型的 15px**（`.track-name { font-size: var(--fs-body) }`）。
 *    设计稿第 3 页第 03 行末尾三枚全宽「！」的字形质心间距实测 16.96 / 17.00px；
 *    同串在渲染侧实测 15.00px。字形包围盒比 141:125 = 1.128 与 17/15 = 1.133 吻合。
 * 2. **两侧行高都是 1**（`leading-none`，且必须写在字号类之后，见 `CELL_LAYER` 的说明）。
 *    Tailwind v4 不为任意长度字号写 line-height，会继承祖先的 1.5（17px → 25.5px），
 *    把副标题推低约 6px。设计稿解出的行内文本块高 = 17 + 6 + 13 = 36px，
 *    跨第 03 / 06 / 09 / 10 / 13 页一致。
 *
 * `mt-[6px]` 与原型的 `.track-sub { margin-top: 6px }` 一致，未改。
 */
export const TrackText = ({ title, subtitle, className }: TrackTextProps) => (
  <div className={twMerge(CELL_LAYER, "min-w-0", className)}>
    <div
      className={twMerge(
        "truncate text-[length:var(--biu-type-list-title-size)] leading-none font-semibold",
        "text-[rgb(var(--biu-text-primary))]",
      )}
    >
      {title}
    </div>
    {subtitle !== undefined && subtitle !== null && (
      <div
        className={twMerge(
          "mt-[6px] truncate text-[length:var(--biu-type-label-size)] leading-none",
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
      "truncate text-[length:var(--biu-type-label-size)] leading-none tabular-nums",
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
  /**
   * **全部**动作。设计稿第 3 页的带子是五枚等大圆片、**没有**主操作档，
   * 播放只是第一枚，因此这里不再有 `primary` 槽位。
   */
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
 *
 * 几何全部来自设计稿第 3 页第 04 行实测（spec-lock `material.rowActionBand`），
 * **不是原型的值**。原型 `.track-actions` 是「38px 反色主操作 + `.sep` 分隔线 +
 * 五枚 30px、gap 4、padding 5×6、`right: 24px`」；设计稿是「五枚等大 34px、
 * gap 6、padding 4×8、无分隔线、无主操作档」，且动作集合少一枚「上一首」。
 * 逐项实测：带子 bbox 210 × 42（= 5×34 + 4×6 + 2×8 与 34 + 2×4）、
 * 圆片横向 612–643 / 652–683 / 692–723 / 732–763 / 772–803。
 * 横向锚点也不是原型的 `right: 24px`（贴行右缘）—— 设计稿带子右缘在画布
 * x812，行右缘 x1376，故右偏移 = 564 = col4 + col5 + listPadRight + 152px。
 */
export const TrackTableActions = ({ actions, className }: TrackTableActionsProps) => (
  <div
    className={twMerge(
      // z-index 3：压过行高亮（1）与行内容（1）。原型同此。
      "absolute top-1/2 z-[3] inline-flex -translate-y-1/2 items-center gap-[6px]",
      "right-[calc(var(--biu-layout-col-4)+var(--biu-layout-col-5)+var(--biu-layout-list-pad-r)+152px)]",
      // 玻璃材质写在**带子**上，不是写在按钮上（见 GlassButton 的 tone 说明）。
      "rounded-[var(--biu-radius-pill)] border border-[var(--biu-veil-18)] bg-[var(--biu-veil-14)]",
      "p-[4px_8px] backdrop-blur-[var(--biu-blur-glass)]",
      className,
    )}
  >
    {actions?.map(action => (
      <GlassButton
        key={action.key}
        // 行内带**没有**悬停反馈（原型 `.track-actions .round` 无 `:hover` 规则）。
        tone="bare"
        size={34}
        iconSize={17}
        label={action.label}
        icon={action.icon}
        disabled={action.disabled}
        onClick={action.onPress}
      />
    ))}
  </div>
);
