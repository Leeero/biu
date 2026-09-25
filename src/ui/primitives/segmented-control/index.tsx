import type { KeyboardEvent, ReactNode } from "react";
import { Link } from "react-router";

import { twMerge } from "tailwind-merge";

export interface SegmentItem {
  /** 稳定键。`href` 存在时通常是路由路径，否则是模式值。 */
  key: string;
  label: ReactNode;
  /** 可选计数（原型 `.tab .count`）。数字一律用等宽数字，避免切换时宽度跳动。 */
  count?: number | string;
  /** 有 `href` 时渲染为链接（导航形态）。 */
  href?: string;
  /**
   * 「已声明但交互尚未接线」。
   *
   * 顶栏的分段组有个真实的中间态：标签由路由契约给出来了，但对应的子视图
   * 切换还没落地（`ROUTE_SEGMENTS` 拆到各屏自己的阶段填）。此时渲染成按钮
   * 就是一个**点了没反应的假控件**，而原型里根本没有「未接线」这一态，
   * 所以也不能置灰 —— 置灰同样是发明。
   *
   * 因此渲染为不可交互元素：读屏能知道它现在不可用，视觉上仍按未激活项着色。
   * 接线之后这个标记就该消失，而不是留成长期的第三态。
   */
  pending?: boolean;
  disabled?: boolean;
}

export type SegmentedSize = "default" | "compact";

interface SegmentedControlProps {
  items: SegmentItem[];
  /** 无障碍名称。顶栏用「顶栏分段导航」，沉浸态模式切换用「显示模式」。 */
  label: string;
  /**
   * 当前选中项的 key。
   * 导航形态由调用方按路由计算；模式切换形态按受控值传入。
   */
  activeKey?: string;
  /** 模式切换形态的选中回调。导航形态不需要（链接自己会导航）。 */
  onSelect?: (key: string) => void;
  /**
   * 尺寸。原型两种：
   *   `default` 顶栏用：容器高 40、项高 40、左右内边距 22、字号 13、容器底白 9%。
   *   `compact` 沉浸态模式段用：项高 32、内边距 18、字号 15、容器底白 10% + 8% 描边。
   */
  size?: SegmentedSize;
  /**
   * 关联的内容面板 id。**给了它才用 tab 语义**（`role="tablist"` + `aria-selected`
   * + `aria-controls`）；不给则退化为 `role="group"` + `aria-pressed` 的切换按钮组。
   *
   * 理由：`role="tab"` 承诺「选中项控制某个面板」，若页面上并不存在那个面板，
   * 读屏用户会找不到内容。宁可少一层语义，也不要给一个兑现不了的承诺。
   */
  panelId?: string;
  className?: string;
}

const SIZES: Record<SegmentedSize, { container: string; item: string }> = {
  default: {
    container: "h-10 gap-0.5 bg-[var(--biu-veil-9)] px-2",
    item: "h-10 px-[22px] text-[length:var(--biu-type-label-size)]",
  },
  compact: {
    container: "h-10 gap-0.5 border border-[var(--biu-veil-8)] bg-[var(--biu-surface-hover)] px-2",
    item: "h-8 px-[18px] text-[length:var(--biu-type-body-size)]",
  },
};

/**
 * 分段控件（原型 `.tabgroup` / `.tab` 与 `.np-mode-seg` 的合流）。
 *
 * 同一个视觉原型在设计稿里承担两件事，所以这里用 `mode` 区分语义而不是拆成两个组件：
 *   · **导航**：项带 `href`，渲染 `<nav>` + 链接，激活态由 `aria-current="page"` 表达。
 *   · **模式切换**：项不带 `href`，渲染按钮组，激活态由 `aria-selected`
 *     （配 `panelId` 时）或 `aria-pressed`（否则）表达。
 *
 * 组合键行为按 WAI-ARIA 的 tabs 惯例：左右方向键移动，Home / End 跳首尾。
 * 焦点跟着选项走（roving tabindex），这样连续按方向键能一路切换过去。
 *
 * 几何与配色：
 *   激活项是**反色药丸** —— `--biu-inverse-surface` 底 + `--biu-inverse-ink` 字；
 *   未激活项的字色是 `--biu-text-chrome-label`（顶栏标签专用档），
 *   悬停铺 `--biu-veil-8`（与原型 `.tab:hover` 的 8% 完全一致）。
 */
export const SegmentedControl = ({
  items,
  label,
  activeKey,
  onSelect,
  size = "default",
  panelId,
  className,
}: SegmentedControlProps) => {
  const isNavigation = items.some(item => item.href);
  const sizing = SIZES[size];
  const useTabs = !isNavigation && Boolean(panelId);

  const itemClass = (isActive: boolean, isDisabled: boolean) =>
    twMerge(
      "flex flex-none cursor-pointer items-center gap-1.5 rounded-[var(--biu-radius-pill)]",
      "whitespace-nowrap transition-colors duration-[var(--biu-duration-fast)] ease-[var(--biu-ease-standard)]",
      sizing.item,
      isActive
        ? "bg-[rgb(var(--biu-inverse-surface))] font-semibold text-[rgb(var(--biu-inverse-ink))]"
        : "text-[rgb(var(--biu-text-chrome-label))] hover:bg-[var(--biu-veil-8)]",
      isDisabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
    );

  const countClass = (isActive: boolean) =>
    twMerge(
      "tabular-nums",
      isActive ? "text-[rgb(var(--biu-text-disabled))]" : "text-[rgb(var(--biu-text-quaternary))]",
    );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isNavigation || !onSelect) return;
    const enabled = items.filter(item => !item.disabled);
    if (!enabled.length) return;
    const currentIndex = enabled.findIndex(item => item.key === activeKey);

    const step = (delta: number) => {
      event.preventDefault();
      const next = enabled[(Math.max(currentIndex, 0) + delta + enabled.length) % enabled.length];
      if (next) onSelect(next.key);
    };

    if (event.key === "ArrowRight") step(1);
    else if (event.key === "ArrowLeft") step(-1);
    else if (event.key === "Home") {
      event.preventDefault();
      if (enabled[0]) onSelect(enabled[0].key);
    } else if (event.key === "End") {
      event.preventDefault();
      const last = enabled[enabled.length - 1];
      if (last) onSelect(last.key);
    }
  };

  const body = items.map(item => {
    const isActive = item.key === activeKey;

    if (item.href) {
      return (
        <Link
          key={item.key}
          to={item.href}
          aria-current={isActive ? "page" : undefined}
          className={itemClass(isActive, false)}
        >
          {item.label}
          {item.count !== undefined && <span className={countClass(isActive)}>{item.count}</span>}
        </Link>
      );
    }

    const tabProps = useTabs
      ? { role: "tab" as const, "aria-selected": isActive, "aria-controls": panelId, id: `${panelId}-tab-${item.key}` }
      : { "aria-pressed": isActive };

    if (item.pending) {
      return (
        <span key={item.key} aria-disabled="true" className={itemClass(useTabs ? false : isActive, false)}>
          {item.label}
          {item.count !== undefined && <span className={countClass(isActive)}>{item.count}</span>}
        </span>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        disabled={item.disabled}
        // roving tabindex 只用于 tab 语义：一组 tab 整体只占一个 Tab 停留点，
        // 组内靠方向键移动。若是切换按钮组，每个按钮都应能被 Tab 逐个到达。
        tabIndex={useTabs && !isActive ? -1 : undefined}
        onClick={() => onSelect?.(item.key)}
        className={itemClass(isActive, Boolean(item.disabled))}
        {...tabProps}
      >
        {item.label}
        {item.count !== undefined && <span className={countClass(isActive)}>{item.count}</span>}
      </button>
    );
  });

  const containerClass = twMerge(
    "flex flex-none items-center rounded-[var(--biu-radius-pill)]",
    sizing.container,
    className,
  );

  if (isNavigation) {
    return (
      <nav aria-label={label} className={containerClass}>
        {body}
      </nav>
    );
  }

  return (
    <div role={useTabs ? "tablist" : "group"} aria-label={label} onKeyDown={handleKeyDown} className={containerClass}>
      {body}
    </div>
  );
};
