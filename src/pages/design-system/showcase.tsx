import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

/**
 * §5.3 规定的六态。不是每个组件都能表达全部六态 —— 纯布局组件
 * （`Section` / `MediaGrid` / `Grid`）没有可交互表面，硬塞六个格子只会
 * 让人以为「这里应该有 hover」。因此 `StateMatrix` 的 `states` 可裁剪，
 * 未列出的状态是**有意的缺席**，在 `Showcase` 的 `note` 里说明理由。
 */
export type UiState = "default" | "hover" | "pressed" | "focus-visible" | "disabled" | "loading";

const ALL_STATES: readonly UiState[] = ["default", "hover", "pressed", "focus-visible", "disabled", "loading"];

const STATE_LABEL: Record<UiState, string> = {
  default: "default",
  hover: "hover",
  pressed: "pressed",
  "focus-visible": "focus-visible",
  disabled: "disabled",
  loading: "loading",
};

/**
 * 这三个状态**不靠样式伪造**，而是让格子里的真实控件自己表现：
 * 鼠标移到 hover 格、按住 pressed 格、用 Tab 走到 focus-visible 格，
 * 看到的就是运行时真实的态。
 *
 * 伪造（例如给预览节点挂一个 `.is-hover` 类）需要把「悬停样式」额外复制一份，
 * 于是样式有了两个来源 —— 设计系统页显示的和组件真正用的是两套代码，
 * 这正是设计系统最容易失去可信度的地方。
 */
const LIVE_STATES = new Set<UiState>(["hover", "pressed", "focus-visible"]);

interface StateMatrixProps {
  /** 按状态渲染一个真实实例。 */
  render: (state: UiState) => ReactNode;
  states?: readonly UiState[];
  className?: string;
}

/**
 * 状态矩阵。
 *
 * 布局用固定 6 列网格而不是 flex-wrap：状态之间要能上下对照，
 * 换行会让「第 4 个格子是哪个状态」变得依赖屏宽。
 */
export const StateMatrix = ({ render, states = ALL_STATES, className }: StateMatrixProps) => (
  <div className={twMerge("grid grid-cols-3 gap-x-6 gap-y-5 lg:grid-cols-6", className)}>
    {states.map(state => (
      <div key={state} className="min-w-0">
        <p className="m-0 mb-2 flex items-baseline gap-1.5 text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-disabled))]">
          <span className="font-[family-name:var(--biu-font-numeric)]">{STATE_LABEL[state]}</span>
          {LIVE_STATES.has(state) && (
            <span
              title="需真实交互：把指针移入 / 按住 / 用 Tab 聚焦本格"
              className="cursor-help text-[rgb(var(--biu-text-disabled))]"
            >
              ↗
            </span>
          )}
        </p>
        {/* 高度固定，让不同状态的实例在同一基线上 */}
        <div className="flex min-h-[64px] items-center">{render(state)}</div>
      </div>
    ))}
  </div>
);

interface ShowcaseProps {
  /** 组件名。会渲染成 `<h3>`，页内锚点也用它。 */
  name: string;
  /** 对应的原型类名（含前导点），多个用空格分隔。 */
  proto: string;
  /** 对应设计页页码。色板 / 排版 / 材质在第 14 页。 */
  page: number | string;
  /** 补充说明：状态来源、有意未实现的项、与摘要的差异… */
  note?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * 单个组件的展位。
 *
 * 头部三件事是 P2 出口标准要求的：**组件名、对应原型类、对应设计页**。
 * 少了原型类，展位就退化成「一个看起来还行的组件陈列」；少了设计页，
 * 就没法回到设计稿核对 —— 而这两件事正是这个页面存在的理由。
 */
export const Showcase = ({ name, proto, page, note, children, className }: ShowcaseProps) => (
  <section
    id={`c-${name}`}
    className={twMerge(
      "rounded-[var(--biu-radius-lg)] border border-[var(--biu-border-weak)] bg-[var(--biu-surface-raised)] p-6",
      className,
    )}
  >
    <header className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-[var(--biu-border-weak)] pb-3">
      <h3 className="m-0 text-[length:var(--biu-type-small-size)] font-semibold text-[rgb(var(--biu-text-primary))]">
        {name}
      </h3>
      <code className="font-[family-name:var(--biu-font-numeric)] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-tertiary))]">
        {proto}
      </code>
      <span className="ml-auto text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
        设计页 {page}
      </span>
    </header>

    {children}

    {note && (
      <p className="m-0 mt-4 border-t border-[var(--biu-border-weak)] pt-3 text-[length:var(--biu-type-micro-size)] leading-[1.7] text-[rgb(var(--biu-text-quaternary))]">
        {note}
      </p>
    )}
  </section>
);

interface ExhibitSectionProps {
  title: string;
  note?: ReactNode;
  children: ReactNode;
}

/** 展位分组的外框（§5.1 基础件 / §5.2 模式件 / 令牌）。 */
export const ExhibitSection = ({ title, note, children }: ExhibitSectionProps) => (
  <section className="mt-10 [&+&]:mt-14">
    <h2 className="m-0 mb-1 text-[length:var(--biu-type-lead-size)] font-semibold text-[rgb(var(--biu-text-primary))]">
      {title}
    </h2>
    {note && (
      <p className="m-0 mb-6 max-w-[72ch] text-[length:var(--biu-type-label-size)] leading-[1.7] text-[rgb(var(--biu-text-quaternary))]">
        {note}
      </p>
    )}
    <div className="flex flex-col gap-6">{children}</div>
  </section>
);

/** 展位内的横排容器。 */
export const ExhibitRow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={twMerge("flex flex-wrap items-center gap-3", className)}>{children}</div>
);
