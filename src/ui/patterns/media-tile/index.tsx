import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import type { IconName } from "@/ui/primitives/icon";

import { Artwork } from "@/ui/primitives/artwork";
import { Badge, type BadgeVariant } from "@/ui/primitives/badge";
import { GlassButton } from "@/ui/primitives/glass-button";

export interface TileActionSpec {
  key: string;
  /** 无障碍名称。圆片按钮没有可见文字，这个必填。 */
  label: string;
  icon: IconName;
  onPress?: () => void;
  disabled?: boolean;
}

interface TileActionBandProps {
  actions: readonly TileActionSpec[];
  className?: string;
}

/**
 * 瓦片玻璃操作带。原型 `.actionband`。
 *
 * 构成来自设计稿实测（spec-lock material.tileActionBand）：**五枚等大** 34px
 * 玻璃圆片，没有主操作反色档、没有分隔线。原型 app.css 里的 `.round--lead`
 * （反色主操作）与 `.sep` 是原型的发挥 —— 设计稿第 2 页横向实测 210px =
 * 5×34 + 4×6 + 2×8，与「五枚等大 + 无分隔线」精确吻合，且设计稿注解原文
 * 是「露出 5 个主操作」，五个并列、没有层级。
 *
 * **为什么不与 `TrackTableActions` 合并**：两者在原型的取值几乎每一项都不同，
 * 合并必然要选一套值去覆盖另一套，那就是静默改设计。逐项对比：
 *
 *              行内带 (.track-actions)   瓦片带 (.actionband)
 *   位置        right 24 / 垂直居中      left 50% / top 50% 居中
 *   间距        4                        6
 *   内边距      5 × 6                    7 × 8
 *   描边        白 18%                   白 20%
 *   圆片        30 / 主操作 38           五枚等大 34
 *   图标字号    15 / 17                  17
 *   分隔线      1 × 18，白 20%           无
 *   圆片悬停    无                       有（白 18%）
 *
 * 八项里六项不同 —— 它们不是同一个组件的两个变体，而是两个组件。
 */
export const TileActionBand = ({ actions, className }: TileActionBandProps) => (
  <div
    className={twMerge(
      // z-index 3：压过瓦片遮罩（after 的默认层）与文案（z-2）。原型同此。
      "absolute top-1/2 left-1/2 z-[3] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-[6px]",
      "rounded-[var(--biu-radius-pill)] border border-[var(--biu-veil-20)] bg-[var(--biu-surface-glass)]",
      "p-[7px_8px] backdrop-blur-[var(--biu-blur-glass)]",
      className,
    )}
  >
    {actions.map(action => (
      <GlassButton
        key={action.key}
        // 瓦片带**有**悬停反馈（原型 `.actionband .round:hover`），
        // 与行内带（`.track-actions .round` 无悬停规则）不同，故用 plain 而非 bare。
        tone="plain"
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

interface MediaTileProps {
  title: ReactNode;
  meta?: ReactNode;
  /** 封面地址；缺省用占位渐变。 */
  art?: string;
  /**
   * 显式占位渐变（完整 background-image 值），逐字压过 artKey 哈希选择。
   * 夹具 / 演示位用：设计稿对每枚瓦片的封面渐变是逐字比对的。
   * 注意它与 `art`（网络地址）是两个口 —— 渐变塞进 `art` 会得到一张
   * 必然加载失败的 `<img>`，随后静默回落到哈希渐变。
   */
  artGradient?: string;
  /** 稳定占位键（通常是领域 ID），同一条内容每次拿到同一个占位色。 */
  artKey?: string;
  /** 左上角来源徽标（`收藏夹` / `合集` / `系列` / `本地目录`）。 */
  badge?: ReactNode;
  badgeVariant?: BadgeVariant;
  /** 操作带。传入即渲染，但**默认只在悬停或当前项时露出**（设计稿注解原文：
   *  「悬停或选中瓦片：玻璃操作带直接露出 5 个主操作」）。 */
  actions?: readonly TileActionSpec[];
  /**
   * 当前项（选中 / 播放中）。
   *
   * 原型里瓦片的「选中」**没有独立的视觉**：它的表达方式与悬停相同，
   * 都是「露出玻璃操作带」。因此这里也只做两件事 —— 挂 `aria-current`
   * 与常驻露出操作带，**不额外加描边或发光**。加描边是发明设计稿里没有的状态。
   */
  current?: boolean;
  /** 强制露出操作带。用于演示页与截图对比（那里没有真实指针）。 */
  forceActionsVisible?: boolean;
  onPress?: () => void;
  className?: string;
}

/**
 * 媒体瓦片。原型 `.tile` / `.tile-art` / `.tile::after` / `.tile-copy`。
 *
 * 四层结构，顺序不能换：
 *   `Artwork` 铺底 → `::after` 底部渐隐遮罩 → 徽标 → 文案
 *
 * 遮罩（`--biu-scrim-veil`）不是装饰：瓦片上的标题压在封面图上，
 * 封面可能是任意亮度，没有这层渐隐，浅色封面上的白字会读不出来。
 * 它用 `::after` 而不是额外一个 `<div>`：`::after` 不参与可访问性树，
 * 也不会被误当成内容节点。
 *
 * `isolation: isolate` 保留自原型，作用是让瓦片内部的 z-index 自成一层，
 * 不会被外层堆叠上下文（如播放栏）意外穿插到中间。
 */
export const MediaTile = ({
  title,
  meta,
  art,
  artGradient,
  artKey,
  badge,
  badgeVariant = "default",
  actions,
  current = false,
  forceActionsVisible = false,
  onPress,
  className,
}: MediaTileProps) => {
  const hasBand = Boolean(actions && actions.length > 0);
  const bandVisible = forceActionsVisible || current;

  return (
    <article
      aria-current={current ? "true" : undefined}
      className={twMerge(
        "group/tile relative isolate aspect-video cursor-pointer overflow-hidden",
        "rounded-[var(--biu-radius-md)] bg-[rgb(var(--biu-surface-art-bed))]",
        "after:pointer-events-none after:absolute after:inset-0 after:bg-[var(--biu-scrim-veil)] after:content-['']",
        className,
      )}
    >
      <Artwork
        src={art}
        placeholder={artGradient}
        artKey={artKey}
        alt=""
        radius="none"
        className="absolute inset-0 h-full w-full"
      />

      {badge && (
        <Badge variant={badgeVariant} className="absolute top-3 left-3 z-[2]">
          {badge}
        </Badge>
      )}

      {hasBand && actions && (
        <TileActionBand
          actions={actions}
          className={twMerge(
            "transition-opacity duration-[var(--biu-duration-fast)]",
            bandVisible ? "opacity-100" : "opacity-0 group-hover/tile:opacity-100",
          )}
        />
      )}

      {onPress && (
        // 整块可点，但**不**把 <article> 变成 <button>：article 里有操作按钮，
        // 嵌套按钮是无效 HTML。改为铺一层透明按钮承担点击与键盘焦点，
        // 操作带在它之上（z-3）仍然可点。
        <button
          type="button"
          aria-label={typeof title === "string" ? title : undefined}
          onClick={onPress}
          className="absolute inset-0 z-[1] cursor-pointer rounded-[var(--biu-radius-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--biu-accent))]"
        />
      )}

      {/* 文案块的落点来自设计稿实测（spec-lock geometry.tileCopy）：
          bottom 24、元信息与标题间距 0。原型 app.css 的 16 / 6 会把元信息
          推低 5.5px —— 设计稿的标题与元信息是贴紧的一组。
          `pointer-events-none` 是重构新增的，原型不需要（原型没有交互）：
          文案叠在铺满整块的透明按钮之上，若它可以接收指针事件，标题那一条就点不动了。
          代价是封面标题不可选中 —— 标题本身在领域数据里，需要复制时从详情页取。 */}
      <div className="pointer-events-none absolute right-[var(--biu-layout-tile-copy-x)] bottom-[var(--biu-layout-tile-copy-bottom)] left-[var(--biu-layout-tile-copy-x)] z-[2]">
        <div className="text-[24px] leading-[1.2] font-semibold tracking-[-0.3px] text-[rgb(var(--biu-text-primary))]">
          {title}
        </div>
        {meta !== undefined && meta !== null && (
          <div className="text-[length:var(--biu-type-body-size)] text-[rgb(var(--biu-text-secondary))]">{meta}</div>
        )}
      </div>
    </article>
  );
};
