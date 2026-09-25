import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { Artwork } from "@/ui/primitives/artwork";
import { Badge, type BadgeVariant } from "@/ui/primitives/badge";

interface AlbumCardProps {
  title: ReactNode;
  /** 属性标签（原型 `.album-tag`，下边距 12）。 */
  tag?: ReactNode;
  /** 元信息行（原型 `.album-meta`）。 */
  meta?: ReactNode;
  /** 底部操作行（原型 `.album-foot`，`margin-top: auto` 顶到底）。 */
  footer?: ReactNode;
  art?: string;
  artKey?: string;
  /** 封面左上角徽标（原型 `.album-art .badge`：left 10 / top 10）。 */
  badge?: ReactNode;
  badgeVariant?: BadgeVariant;
  /** 封面左下角的画幅说明（原型 `.album-art .ratio-note`：left 10 / bottom 8）。 */
  ratioNote?: ReactNode;
  className?: string;
}

/**
 * 专辑 / 歌单卡（原型 `.album-card`）。
 *
 * **注意原型里 `.album-card` 被定义了两次**（app.css:894 与 app.css:1613），
 * 后一处覆盖前一处。生效值是后一处：
 *   padding 16（不是 18）、新增固定 `height: 176px`；
 *   同时 `.album-body` 追加 `padding-top: 34px`、`.album-title` 改为 22px/28px。
 * 这里按**生效值**实现。照着前面那一处写会得到 18px 内边距和自适应高度 ——
 * 那是原型自己改掉的旧稿。这类「同一选择器出现两次」的情况在本文件里不止一处
 * （`.creator-row`、`.lyrics`、`.tracklist--search` 同理），核实时必须以文件末尾为准。
 *
 * 固定 176px 高是设计决策而非随手写的：三张卡在同一行里高度必须一致，
 * 内容多少由 `line-clamp` 或调用方截断，不能让高度自己长。
 */
export const AlbumCard = ({
  title,
  tag,
  meta,
  footer,
  art,
  artKey,
  badge,
  badgeVariant = "default",
  ratioNote,
  className,
}: AlbumCardProps) => (
  <article
    className={twMerge(
      "relative flex h-[176px] gap-[18px] rounded-[var(--biu-radius-lg)] border border-[var(--biu-border-weak)] bg-[var(--biu-surface-raised)] p-4",
      className,
    )}
  >
    <div className="relative isolate h-[118px] w-[118px] flex-none overflow-hidden rounded-[var(--biu-radius-md)]">
      <Artwork src={art} artKey={artKey} alt="" radius="none" className="absolute inset-0 h-full w-full" />
      {badge && (
        <Badge variant={badgeVariant} className="absolute top-[10px] left-[10px] z-[2]">
          {badge}
        </Badge>
      )}
      {ratioNote !== undefined && ratioNote !== null && (
        <span className="absolute bottom-2 left-[10px] z-[2] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
          {ratioNote}
        </span>
      )}
    </div>

    <div className="flex min-w-0 flex-col pt-[34px]">
      {tag && <div className="mb-3">{tag}</div>}
      <h3 className="m-0 text-[22px] leading-7 font-semibold tracking-[-0.3px] text-[rgb(var(--biu-text-primary))]">
        {title}
      </h3>
      {meta !== undefined && meta !== null && (
        <p className="m-0 mt-[2px] text-[length:var(--biu-type-label-size)] leading-5 text-[rgb(var(--biu-text-quaternary))]">
          {meta}
        </p>
      )}
      {footer && <div className="mt-auto flex gap-2">{footer}</div>}
    </div>
  </article>
);

interface AlbumGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * 专辑卡栅格（原型 `.album-grid`）：**3 列、间距 23**。
 *
 * 间距 23 与瓦片栅格的 20 是两个不同的值，别顺手统一 ——
 * 专辑卡本身有 20px 内边距，23 的间距是为了让卡与卡的**内容**看起来等距。
 */
export const AlbumGrid = ({ children, className }: AlbumGridProps) => (
  <div className={twMerge("grid grid-cols-3 gap-[23px]", className)}>{children}</div>
);
