import type { ReactNode } from "react";

import { twMerge } from "tailwind-merge";

import { Artwork } from "@/ui/primitives/artwork";
import { Badge, type BadgeVariant } from "@/ui/primitives/badge";
import { GlassButton } from "@/ui/primitives/glass-button";
import { Tag, type TagVariant } from "@/ui/primitives/tag";

interface HeroCardTag {
  key: string;
  label: ReactNode;
  variant?: TagVariant;
}

interface HeroCardProps {
  title: ReactNode;
  /** 副信息行（创作者 · 播放量 · 时长）。原型 `.hero-meta`。 */
  meta?: ReactNode;
  /** 标题上方的属性标签（原型 `.hero-body .tag`，下边距 14）。 */
  tag?: ReactNode;
  /** 标题下方的标签组（原型 `.hero-tags`，上边距 18、换行、间距 8）。 */
  tags?: readonly HeroCardTag[];
  art?: string;
  artKey?: string;
  /** 封面左上角徽标（原型 `.hero-art .badge`：left 12 / top 12）。 */
  badge?: ReactNode;
  badgeVariant?: BadgeVariant;
  /** 封面左下角的画幅说明（原型 `.hero-art .ratio-note`）。 */
  ratioNote?: ReactNode;
  onPlay?: () => void;
  /** 无 `onPlay` 时不渲染播放键（原型里它恒在，留给只读展示的调用方关掉）。 */
  playLabel?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * 发现音乐大卡（原型 `.hero-card` 及其子元素）。
 *
 * 几何：三列 `420px | minmax(0,1fr) | 96px`、间距 32、内边距 24、圆角 20、
 * 白 6% 底 + 白 6% 描边。三列里的第三列是**播放键的槽位**（宽 96，键 62 居中），
 * 所以播放键不是绝对定位，而是 grid 的一列 —— 这在窄容器下会自动收窄，
 * 改成绝对定位就会压到文案上。
 *
 * 封面用 `Artwork` 的 `heroCard` / `heroList` 占位：原型在卡片分支与列表分支
 * 用了两条不同的固定渐变（卡片分支更暗、列表分支偏蓝），两者都是数据夹具里
 * 的登记值，不是设计令牌。
 */
export const HeroCard = ({
  title,
  meta,
  tag,
  tags,
  art,
  artKey,
  badge,
  badgeVariant = "default",
  ratioNote,
  onPlay,
  playLabel = "播放",
  children,
  className,
}: HeroCardProps) => (
  <article
    className={twMerge(
      "relative grid grid-cols-[420px_minmax(0,1fr)_96px] items-center gap-8",
      "rounded-[var(--biu-radius-lg)] border border-[var(--biu-border-weak)] bg-[var(--biu-surface-raised)] p-6",
      className,
    )}
  >
    <div className="relative isolate aspect-video overflow-hidden rounded-[var(--biu-radius-md)]">
      <Artwork
        src={art}
        artKey={artKey}
        alt=""
        radius="none"
        gradient="heroList"
        className="absolute inset-0 h-full w-full"
      />
      {badge && (
        <Badge variant={badgeVariant} className="absolute top-3 left-3 z-[2]">
          {badge}
        </Badge>
      )}
      {ratioNote !== undefined && ratioNote !== null && (
        <span className="absolute bottom-3 left-[14px] z-[2] text-[length:var(--biu-type-micro-size)] text-[rgb(var(--biu-text-quaternary))]">
          {ratioNote}
        </span>
      )}
    </div>

    <div className="min-w-0">
      {tag && <div className="mb-[14px]">{tag}</div>}
      <h3 className="m-0 text-[30px] leading-[1.24] font-semibold tracking-[-0.5px] text-[rgb(var(--biu-text-primary))]">
        {title}
      </h3>
      {meta !== undefined && meta !== null && (
        <p className="m-0 mt-3 text-[length:var(--biu-type-small-size)] text-[rgb(var(--biu-text-secondary))]">
          {meta}
        </p>
      )}
      {tags && tags.length > 0 && (
        <div className="mt-[18px] flex flex-wrap gap-2">
          {tags.map(item => (
            <Tag key={item.key} variant={item.variant}>
              {item.label}
            </Tag>
          ))}
        </div>
      )}
      {children}
    </div>

    {onPlay && (
      <GlassButton
        tone="inverse"
        size={62}
        iconSize={26}
        label={playLabel}
        icon="play"
        onClick={onPlay}
        className="justify-self-center"
      />
    )}
  </article>
);
