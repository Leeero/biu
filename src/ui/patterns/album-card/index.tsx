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
  /**
   * 显式占位底图（完整 `background-image` 值）。给定即**逐字采用**。
   *
   * 夹具路径用它对齐设计稿的封面渐变 —— 让 `Artwork` 按 `artKey` 哈希另选一条，
   * 保真度比对报出的差异就分不清是「实现走样」还是「数据本来就不同」。
   */
  artPlaceholder?: string;
  /** 封面左上角徽标。 */
  badge?: ReactNode;
  badgeVariant?: BadgeVariant;
  className?: string;
}

/**
 * 专辑 / 歌单卡（原型 `.album-card`）。
 *
 * **几何取自设计稿第 8 页，不是原型**：封面 **160 见方**、卡高 **200**、
 * 内边距 **19**、图文间距 **20**。原型 `assets/app.css:1613`（**第二处定义，
 * 覆盖前一处 app.css:894**）写的是「118 × 118 / 176 / 16 / 18」—— 照着前面那
 * 一处写会得到 18px 内边距，照着生效的那一处写会得到 118 与 176，两者都不对。
 * 这类「同一选择器出现两次」在本文件里不止一处（`.creator-row`、`.lyrics`、
 * `.tracklist--search` 同理），核实时必须以文件末尾为准。
 *
 * 卡高 176 与 200 的差**在设计稿里看得见**：首行卡片从 622 一直排到播放栏上缘
 * 812 仍未收边，176 的卡会在此之前就结束 —— 这不是风格差异，是结构差异。
 *
 * 另外两条同样按设计稿、不按原型：标题是 **17px**（1.3.19 按字形间距重定，此前
 * 误记 22）、正文上边距是 **30**（不是原型的 34），且**页脚跟随文档流而不是
 * `mt-auto`** —— 后一条是「卡高由封面决定、正文列自然高只有 138」的必然结果。
 *
 * **这里没有画幅说明。** 原型在 `.album-art` 里画了 `<span class="ratio-note">1:1</span>`，
 * 设计稿第 8 页三张封面左下角**逐点为空**（三张卡该区域 `> 底 + 8` 的像素数均为 0），
 * 那是原型发挥。缺的不只是一个 prop —— 结构上不提供，补不回来（spec-lock 1.3.16 第 4 条）。
 * 大卡的画幅说明相反是**有**的，见 `HeroCard.ratioNote`。
 *
 * 固定 200px 高是设计决策而非随手写的：三张卡在同一行里高度必须一致，
 * 内容多少由 `line-clamp` 或调用方截断，不能让高度自己长。
 */
export const AlbumCard = ({
  title,
  tag,
  meta,
  footer,
  art,
  artKey,
  artPlaceholder,
  badge,
  badgeVariant = "default",
  className,
}: AlbumCardProps) => (
  <article
    className={twMerge(
      "relative flex h-[var(--biu-layout-album-h)] gap-[var(--biu-layout-album-gap)]",
      "rounded-[var(--biu-radius-lg)] border border-[var(--biu-border-weak)] bg-[var(--biu-surface-raised)]",
      "p-[var(--biu-layout-album-pad)]",
      className,
    )}
  >
    <div className="relative isolate h-[var(--biu-layout-album-art)] w-[var(--biu-layout-album-art)] flex-none overflow-hidden rounded-[var(--biu-radius-md)]">
      <Artwork
        src={art}
        artKey={artKey}
        placeholder={artPlaceholder}
        alt=""
        radius="none"
        className="absolute inset-0 h-full w-full"
      />
      {badge && (
        <Badge
          variant={badgeVariant}
          className="absolute top-[var(--biu-layout-album-badge-inset)] left-[var(--biu-layout-album-badge-inset)] z-[2]"
        >
          {badge}
        </Badge>
      )}
    </div>

    <div className="flex min-w-0 flex-col pt-[var(--biu-layout-album-body-pt)]">
      {tag && <div className="mb-3">{tag}</div>}
      {/*
        标题 17px / 行盒 28（= `--biu-type-small` 档的尺寸），meta 13px / 行盒 20。
        字号由**字形段起点间距**定（spec-lock 1.3.19）：1.3.16 记的 22 是从墨迹盒高
        反推的产物。行盒 28 与三个竖直量（上边距 30、metaGap 2、footGap 36）的锚点
        是「标题盒顶 672」，与盒内字号无关，故一字未改。
      */}
      <h3 className="m-0 line-clamp-2 text-[length:var(--biu-type-small-size)] leading-7 font-semibold tracking-[-0.3px] text-[rgb(var(--biu-text-primary))]">
        {title}
      </h3>
      {meta !== undefined && meta !== null && (
        <p className="m-0 mt-[var(--biu-layout-album-meta-gap)] text-[length:var(--biu-type-label-size)] leading-5 text-[rgb(var(--biu-text-quaternary))]">
          {meta}
        </p>
      )}
      {/*
        页脚**跟随文档流**，不是 `mt-auto` —— 卡高 200 由封面 160 决定，正文列自然高
        只有 138，页脚下方留 22px 空卡底。用 `mt-auto` 会把它压到内容盒底（780–802），
        比设计稿的 758–780 低 22。见 spec-lock `geometry.albumCard.footGap`。
      */}
      {footer && <div className="mt-[var(--biu-layout-album-foot-gap)] flex gap-2">{footer}</div>}
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
  <div className={twMerge("grid grid-cols-3 gap-[var(--biu-layout-album-grid-gap)]", className)}>{children}</div>
);
